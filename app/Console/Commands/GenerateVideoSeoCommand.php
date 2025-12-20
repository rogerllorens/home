<?php

namespace App\Console\Commands;

use App\Jobs\GenerateVideoSeoJob;
use App\Models\Video;
use Illuminate\Console\Command;

class GenerateVideoSeoCommand extends Command
{
    protected $signature = 'videos:ai {--limit=5000}';
    protected $description = 'Dispatch AI SEO generation jobs for videos';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        $videos = Video::query()
            ->where('status', \App\Enums\VideoStatus::Draft)
            ->whereNotNull('raw_title')
            ->limit($limit)
            ->get();

        foreach ($videos as $video) {
            GenerateVideoSeoJob::dispatch($video->id);
        }

        $this->info("Dispatched {$videos->count()} jobs.");

        return self::SUCCESS;
    }
}
