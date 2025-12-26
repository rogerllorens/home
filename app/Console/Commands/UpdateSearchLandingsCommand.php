<?php

namespace App\Console\Commands;

use App\Models\SearchLanding;
use App\Services\Search\SearchLandingService;
use Illuminate\Console\Command;

class UpdateSearchLandingsCommand extends Command
{
    protected $signature = 'landings:update {--limit=500}';
    protected $description = 'Refresh search landing metadata and counts';

    public function handle(SearchLandingService $landingService): int
    {
        $limit = (int) $this->option('limit');

        $landings = SearchLanding::query()
            ->where('is_public', true)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();

        foreach ($landings as $landing) {
            $count = $landingService->countForQuery($landing->query);
            $landing->update([
                'videos_count' => $count,
            ]);
        }

        $this->info("Updated {$landings->count()} search landings.");

        return self::SUCCESS;
    }
}
