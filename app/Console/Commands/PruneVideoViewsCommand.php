<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneVideoViewsCommand extends Command
{
    protected $signature = 'videos:prune-views {--days=}';
    protected $description = 'Prune old device video view records';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('videos.view_retention_days', 90));
        $cutoff = now()->subDays($days);

        $deleted = DB::table('video_views')
            ->where('viewed_at', '<', $cutoff)
            ->delete();

        $this->info("Pruned {$deleted} video view records older than {$days} days.");

        return self::SUCCESS;
    }
}
