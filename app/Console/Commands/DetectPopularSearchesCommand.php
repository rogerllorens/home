<?php

namespace App\Console\Commands;

use App\Models\LandingCandidate;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DetectPopularSearchesCommand extends Command
{
    protected $signature = 'search:detect-popular {--min-count=50} {--min-results=10} {--limit=200}';
    protected $description = 'Detect popular search queries and create landing candidates';

    public function handle(): int
    {
        $minCount = (int) $this->option('min-count');
        $minResults = (int) $this->option('min-results');
        $limit = (int) $this->option('limit');
        $cutoff = now()->subDays(30);

        $popularQueries = DB::table('search_queries')
            ->selectRaw('normalized_query, count(*) as total, max(results_count) as max_results')
            ->where('created_at', '>=', $cutoff)
            ->groupBy('normalized_query')
            ->havingRaw('count(*) >= ?', [$minCount])
            ->havingRaw('max(results_count) >= ?', [$minResults])
            ->orderByDesc('total')
            ->limit($limit)
            ->get();

        $upserted = 0;
        foreach ($popularQueries as $row) {
            $query = (string) $row->normalized_query;
            $slug = Str::slug($query);

            if ($slug === '') {
                continue;
            }

            $candidate = LandingCandidate::query()->where('slug', $slug)->first();
            $status = $candidate?->status ?? 'candidate';

            if ($status === 'ignored') {
                continue;
            }

            LandingCandidate::updateOrCreate(
                ['slug' => $slug],
                [
                    'query' => $query,
                    'hits_last_30d' => (int) $row->total,
                    'videos_count' => (int) $row->max_results,
                    'status' => $status,
                ]
            );
            $upserted++;
        }

        $this->info("Detected {$upserted} popular search candidates.");

        return self::SUCCESS;
    }
}
