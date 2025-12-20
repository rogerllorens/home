<?php

namespace App\Console\Commands;

use App\Enums\VideoStatus;
use App\Jobs\CheckVideoEmbedJob;
use App\Models\Video;
use Illuminate\Console\Command;

class CheckEmbedsCommand extends Command
{
    protected $signature = 'videos:check-embeds {--limit=5000}';
    protected $description = 'Check embed availability for videos';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        $videos = Video::query()
            ->whereIn('status', [VideoStatus::Published, VideoStatus::Ready])
            ->limit($limit)
            ->get();

        foreach ($videos as $video) {
            CheckVideoEmbedJob::dispatch($video->id);
        }

        $this->info("Dispatched {$videos->count()} embed checks.");

        return self::SUCCESS;
    }
}
