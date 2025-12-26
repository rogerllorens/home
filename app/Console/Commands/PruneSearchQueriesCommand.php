<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneSearchQueriesCommand extends Command
{
    protected $signature = 'search:prune-queries {--days=90} {--min-count=2}';
    protected $description = 'Prune old or low-signal search queries';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $minCount = (int) $this->option('min-count');

        $cutoff = now()->subDays($days);
        $deletedOld = DB::table('search_queries')
            ->where('created_at', '<', $cutoff)
            ->delete();

        $rareQueries = DB::table('search_queries')
            ->select('normalized_query')
            ->groupBy('normalized_query')
            ->havingRaw('count(*) < ?', [$minCount])
            ->pluck('normalized_query')
            ->all();

        $deletedRare = 0;
        if (!empty($rareQueries)) {
            $deletedRare = DB::table('search_queries')
                ->whereIn('normalized_query', $rareQueries)
                ->delete();
        }

        $this->info("Pruned {$deletedOld} old rows and {$deletedRare} low-signal rows.");

        return self::SUCCESS;
    }
}
