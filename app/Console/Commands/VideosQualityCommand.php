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
                $status = $this->evaluateStatus($video, $canonicalizer);
                $video->status = $status;
                $video->category_slug = $normalizer->normalize($video->category_slug);
                $video->save();
            }
        } finally {
            $lock->release();
        }

        $this->info("Processed {$videos->count()} videos.");

        return self::SUCCESS;
    }

    private function evaluateStatus(Video $video, EmbedUrlCanonicalizer $canonicalizer): VideoStatus
    {
        if (empty($video->seo_title) || empty($video->seo_description)) {
            return VideoStatus::Quarantine;
        }

        if (empty($video->thumbnail_url)) {
            return VideoStatus::Quarantine;
        }

        $allowHttp = (bool) ($video->source?->settings['allow_http'] ?? false);
        $canonical = $canonicalizer->canonicalize($video->embed_url, $allowHttp);
        if ($canonical === null) {
            return VideoStatus::Broken;
        }

        $qualityMin = config('candidboys.seo.quality_min', 55);
        if (($video->ai_quality ?? 0) < $qualityMin) {
            return VideoStatus::Quarantine;
        }

        $allowed = Arr::wrap($video->source?->settings['allow_iframe_domains'] ?? []);
        $host = parse_url($canonical, PHP_URL_HOST);
        if (!in_array($host, $allowed, true)) {
            return VideoStatus::Quarantine;
        }

        return VideoStatus::Ready;
    }
}
