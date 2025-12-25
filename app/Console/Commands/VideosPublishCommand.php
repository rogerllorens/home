<?php

namespace App\Console\Commands;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class VideosPublishCommand extends Command
{
    protected $signature = 'videos:publish {--daily=3000}';
    protected $description = 'Publish ready videos daily';

    public function handle(): int
    {
        $lock = Cache::lock('pipeline:daily', 3600);
        if (!$lock->get()) {
            $this->info('Pipeline lock active, skipping publish run.');
            return self::SUCCESS;
        }

        $daily = (int) $this->option('daily');

        $videos = Video::query()
            ->where('status', VideoStatus::Ready)
            ->orderByDesc('ai_quality')
            ->orderByDesc('created_at')
            ->limit($daily)
            ->get();

        try {
            foreach ($videos as $video) {
                $video->update([
                    'status' => VideoStatus::Published,
                    'published_at' => now(),
                ]);
            }
            if ($videos->isNotEmpty()) {
                PublicCache::bust();
            }
        } finally {
            $lock->release();
        }

        $this->info("Published {$videos->count()} videos.");

        return self::SUCCESS;
    }
}
