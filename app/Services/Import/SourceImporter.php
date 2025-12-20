<?php

namespace App\Services\Import;

use App\DTO\VideoCandidate;
use App\Enums\ImportRunStatus;
use App\Enums\VideoStatus;
use App\Models\ImportRun;
use App\Models\Source;
use App\Models\Video;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class SourceImporter
{
    public function __construct(
        private readonly EmbedUrlCanonicalizer $canonicalizer,
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
            'created' => 0,
            'updated' => 0,
            'duplicates' => 0,
            'quarantined' => 0,
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
                'meta' => $summary,
            ]);
        } catch (\Throwable $exception) {
            $summary['errors'][] = $exception->getMessage();

            $run->update([
                'status' => ImportRunStatus::Failed,
                'finished_at' => now(),
                'meta' => $summary,
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
        $allowHttp = (bool) ($source->settings['allow_http'] ?? false);
        $canonicalUrl = $this->canonicalizer->canonicalize($candidate->embedUrl, $allowHttp);

        if ($canonicalUrl === null) {
            $summary['errors'][] = "URL inválida: {$candidate->embedUrl}";
            return 'errors';
        }

        $allowedDomains = Arr::wrap($source->settings['allow_iframe_domains'] ?? []);
        $host = parse_url($canonicalUrl, PHP_URL_HOST);
        $isAllowedHost = in_array($host, $allowedDomains, true);

        $video = Video::where('source_id', $source->id)
            ->where('external_id', $candidate->externalId)
            ->first();

        $existingByEmbed = Video::where('embed_url', $canonicalUrl)->first();
        if ($existingByEmbed && (!$video || $existingByEmbed->id !== $video->id)) {
            $existingByEmbed->increment('duplicate_count');
            return 'duplicates';
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
        ];

        if (!$isAllowedHost) {
            $payload['status'] = VideoStatus::Quarantine;
            $payload['embed_ok'] = false;
            $summary['quarantined']++;
            $summary['errors'][] = "Host no permitido: {$host}";
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

            $video->save();

            return 'updated';
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

        $video->save();

        return 'created';
    }

    private function normalizeTags(?array $tags): array
    {
        if ($tags === null) {
            return [];
        }

        if (is_string($tags)) {
            $tags = preg_split('/[,|]/', $tags) ?: [];
        }

        return array_values(array_filter(array_map('trim', $tags)));
    }
}
