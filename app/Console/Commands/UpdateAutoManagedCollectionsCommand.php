<?php

namespace App\Console\Commands;

use App\Models\Collection;
use App\Models\SearchLanding;
use App\Services\Search\SearchLandingService;
use Illuminate\Console\Command;

class UpdateAutoManagedCollectionsCommand extends Command
{
    protected $signature = 'collections:update-auto {--limit=200}';
    protected $description = 'Refresh videos for auto-managed collections linked to discover landings';

    public function handle(SearchLandingService $landingService): int
    {
        $limit = (int) $this->option('limit');

        $landings = SearchLanding::query()
            ->whereNotNull('collection_id')
            ->limit($limit)
            ->get();

        $updated = 0;
        foreach ($landings as $landing) {
            $collection = Collection::query()
                ->whereKey($landing->collection_id)
                ->where('is_auto_managed', true)
                ->first();

            if (!$collection) {
                continue;
            }

            $videos = $landingService->videosForQuery($landing->query, 50);
            if ($videos->isNotEmpty()) {
                $collection->videos()->syncWithoutDetaching($videos->pluck('id')->all());
            }
            $updated++;
        }

        $this->info("Updated {$updated} auto-managed collections.");

        return self::SUCCESS;
    }
}
