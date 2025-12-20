<?php

namespace App\Console\Commands;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Console\Command;

class VideosPublishCommand extends Command
{
    protected $signature = 'videos:publish {--daily=3000}';
    protected $description = 'Publish ready videos daily';

    public function handle(): int
    {
        $daily = (int) $this->option('daily');

        $videos = Video::query()
            ->where('status', VideoStatus::Ready)
            ->orderByDesc('ai_quality')
            ->orderByDesc('created_at')
            ->limit($daily)
            ->get();

        foreach ($videos as $video) {
            $video->update([
                'status' => VideoStatus::Published,
                'published_at' => now(),
            ]);
        }

        $this->info("Published {$videos->count()} videos.");

        return self::SUCCESS;
    }
}
