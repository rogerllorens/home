<?php

namespace App\Console\Commands;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\CategorySlugNormalizer;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;

class VideosQualityCommand extends Command
{
    protected $signature = 'videos:quality {--limit=5000}';
    protected $description = 'Evaluate quality gates for videos';

    public function handle(EmbedUrlCanonicalizer $canonicalizer, CategorySlugNormalizer $normalizer): int
    {
        $lock = Cache::lock('pipeline:daily', 3600);
        if (!$lock->get()) {
            $this->info('Pipeline lock active, skipping quality run.');
            return self::SUCCESS;
        }

        $limit = (int) $this->option('limit');

        $videos = Video::with('source')
            ->whereIn('status', [VideoStatus::Draft, VideoStatus::AiDone])
            ->limit($limit)
            ->get();

        try {
            foreach ($videos as $video) {
                $evaluation = $this->evaluateStatus($video, $canonicalizer);
                $video->status = $evaluation['status'];
                $video->quarantine_reason = $evaluation['reason'];
                $video->category_slug = $normalizer->normalize($video->category_slug);
                $video->save();
            }
        } finally {
            $lock->release();
        }

        $this->info("Processed {$videos->count()} videos.");

        return self::SUCCESS;
    }

    private function evaluateStatus(Video $video, EmbedUrlCanonicalizer $canonicalizer): array
    {
        if (empty($video->seo_title) || empty($video->seo_description)) {
            return ['status' => VideoStatus::Quarantine, 'reason' => 'missing_seo'];
        }

        if (empty($video->thumbnail_url)) {
            return ['status' => VideoStatus::Quarantine, 'reason' => 'missing_thumbnail'];
        }

        $allowHttp = (bool) ($video->source?->settings['allow_http'] ?? false);
        $canonical = $canonicalizer->canonicalize($video->embed_url, $allowHttp);
        if ($canonical === null) {
            return ['status' => VideoStatus::Broken, 'reason' => 'invalid_embed_url'];
        }

        $qualityMin = config('candidboys.seo.quality_min', 55);
        if (($video->ai_quality ?? 0) < $qualityMin) {
            return ['status' => VideoStatus::Quarantine, 'reason' => 'quality_below_threshold'];
        }

        $allowed = Arr::wrap($video->source?->settings['allow_iframe_domains'] ?? []);
        $host = parse_url($canonical, PHP_URL_HOST);
        if (!in_array($host, $allowed, true)) {
            return ['status' => VideoStatus::Quarantine, 'reason' => 'host_not_allowed'];
        }

        return ['status' => VideoStatus::Ready, 'reason' => null];
    }
}
