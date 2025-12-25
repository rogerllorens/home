<?php

namespace App\Services\Import;

use App\DTO\VideoCandidate;
use App\Enums\ImportRunStatus;
use App\Enums\VideoStatus;
use App\Models\ImportRun;
use App\Models\Source;
use App\Models\Video;
use App\Services\CategorySlugNormalizer;
use App\Services\Embeds\EmbedDomainMatcher;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class SourceImporter
{
    public function __construct(
        private readonly EmbedUrlCanonicalizer $canonicalizer,
        private readonly CategorySlugNormalizer $categoryNormalizer,
        private readonly EmbedDomainMatcher $domainMatcher,
        private readonly FeedJsonAdapter $feedJsonAdapter,
        private readonly FeedXmlAdapter $feedXmlAdapter,
        private readonly ManualAdapter $manualAdapter,
    ) {
    }

    public function import(Source $source): ImportRun
    {
        $run = ImportRun::create([
            'source_id' => $source->id,
            'status' => ImportRunStatus::Running,
            'started_at' => now(),
        ]);

        $summary = [
            'processed' => 0,
            'imported_count' => 0,
            'updated_count' => 0,
            'duplicate_count' => 0,
            'invalid_count' => 0,
            'quarantined_count' => 0,
            'error_count' => 0,
            'errors' => [],
        ];

        try {
            $candidates = $this->resolveAdapter($source)->fetchCandidates($source);

            foreach ($candidates as $candidate) {
                $summary['processed']++;

                $result = $this->upsertCandidate($source, $candidate, $summary);
                $summary[$result]++;
            }

            $run->update([
                'status' => ImportRunStatus::Success,
                'finished_at' => now(),
                'meta' => $this->finalizeSummary($summary),
            ]);
        } catch (\Throwable $exception) {
            $this->pushError($summary, $exception->getMessage());

            $run->update([
                'status' => ImportRunStatus::Failed,
                'finished_at' => now(),
                'meta' => $this->finalizeSummary($summary),
                'error_message' => $exception->getMessage(),
            ]);
        }

        return $run;
    }

    private function resolveAdapter(Source $source): SourceAdapterInterface
    {
        return match ($source->type->value) {
            'feed_json' => $this->feedJsonAdapter,
            'feed_xml' => $this->feedXmlAdapter,
            default => $this->manualAdapter,
        };
    }

    private function upsertCandidate(Source $source, VideoCandidate $candidate, array &$summary): string
    {
        if (empty($candidate->externalId) || empty($candidate->embedUrl) || empty($candidate->rawTitle)) {
            $missing = [];
            if (empty($candidate->externalId)) {
                $missing[] = 'external_id';
            }
            if (empty($candidate->embedUrl)) {
                $missing[] = 'embed_url';
            }
            if (empty($candidate->rawTitle)) {
                $missing[] = 'raw_title';
            }

            $reason = 'missing_fields:'.implode(',', $missing);
            $this->pushError($summary, "Datos incompletos: {$reason}");

            if (!empty($candidate->externalId)) {
                $existing = Video::where('source_id', $source->id)
                    ->where('external_id', $candidate->externalId)
                    ->first();

                if ($existing) {
                    $existing->update([
                        'status' => VideoStatus::Quarantine,
                        'import_error_reason' => $reason,
                    ]);
                }
            }

            return 'invalid_count';
        }

        $allowHttp = (bool) ($source->settings['allow_http'] ?? false);
        $canonicalUrl = $this->canonicalizer->canonicalize($candidate->embedUrl, $allowHttp);

        if ($canonicalUrl === null) {
            $this->pushError($summary, "URL inválida: {$candidate->embedUrl}");
            $existing = Video::where('source_id', $source->id)
                ->where('external_id', $candidate->externalId)
                ->first();
            if ($existing) {
                $existing->update([
                    'status' => VideoStatus::Quarantine,
                    'import_error_reason' => 'invalid_embed_url',
                ]);
            }
            return 'invalid_count';
        }

        $allowedDomains = Arr::wrap($source->settings['allow_iframe_domains'] ?? []);
        $host = parse_url($canonicalUrl, PHP_URL_HOST);
        $isAllowedHost = $this->domainMatcher->isAllowed((string) $host, $allowedDomains);

        $video = Video::where('source_id', $source->id)
            ->where('external_id', $candidate->externalId)
            ->first();

        $existingByEmbed = Video::where('embed_url', $canonicalUrl)->first();
        if ($existingByEmbed && (!$video || $existingByEmbed->id !== $video->id)) {
            $existingByEmbed->increment('duplicate_count');
            return 'duplicate_count';
        }

        $payload = [
            'external_id' => $candidate->externalId,
            'embed_url' => $canonicalUrl,
            'thumbnail_url' => $candidate->thumbnailUrl ?: null,
            'raw_title' => $candidate->rawTitle,
            'raw_description' => $candidate->rawDescription,
            'raw_tags' => $this->normalizeTags($candidate->rawTags),
            'duration_seconds' => $candidate->durationSeconds,
            'source_url' => $candidate->sourceUrl,
            'import_error_reason' => null,
            'quarantine_reason' => null,
        ];

        if (!$isAllowedHost) {
            $payload['status'] = VideoStatus::Quarantine;
            $payload['embed_ok'] = false;
            $payload['quarantine_reason'] = 'host_not_allowed';
            $summary['quarantined_count']++;
            $this->pushError($summary, "Host no permitido: {$host}");
        }

        if ($video) {
            if (!in_array($video->status, [VideoStatus::Broken, VideoStatus::Quarantine], true)) {
                if ($payload['status'] ?? null) {
                    $video->status = $payload['status'];
                }
            }

            $video->fill(Arr::except($payload, ['status']));

            if (empty($video->seo_title)) {
                $video->seo_title = $candidate->rawTitle;
            }

            if (empty($video->seo_description) && $candidate->rawDescription) {
                $video->seo_description = Str::limit($candidate->rawDescription, 300, '');
            }

            $video->category_slug = $this->categoryNormalizer->normalize($video->category_slug);
            $video->save();

            return 'updated_count';
        }

        $video = new Video($payload);
        $video->source_id = $source->id;
        $video->status = $payload['status'] ?? VideoStatus::Draft;
        $video->title = $candidate->rawTitle;
        $video->description = $candidate->rawDescription;

        if ($video->seo_title === null) {
            $video->seo_title = $candidate->rawTitle;
        }

        if ($video->seo_description === null && $candidate->rawDescription) {
            $video->seo_description = Str::limit($candidate->rawDescription, 300, '');
        }

        $video->category_slug = $this->categoryNormalizer->normalize($video->category_slug);
        $video->save();

        return 'imported_count';
    }

    private function normalizeTags(array|string|null $tags): array
    {
        if ($tags === null) {
            return [];
        }

        if (is_string($tags)) {
            $tags = preg_split('/[,|]/', $tags) ?: [];
        }

        if (is_scalar($tags)) {
            $tags = [(string) $tags];
        }

        if (!is_array($tags)) {
            return [];
        }

        $normalized = array_map(static fn ($tag) => trim((string) $tag), $tags);

        return array_values(array_filter($normalized));
    }

    private function pushError(array &$summary, string $message): void
    {
        $summary['error_count']++;

        if (count($summary['errors']) < 50) {
            $summary['errors'][] = $message;
        }
    }

    private function finalizeSummary(array $summary): array
    {
        return $summary;
    }
}
