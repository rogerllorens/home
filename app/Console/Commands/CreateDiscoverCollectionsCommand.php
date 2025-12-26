<?php

namespace App\Console\Commands;

use App\Models\Collection;
use App\Models\SearchLanding;
use App\Services\Search\SearchLandingService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateDiscoverCollectionsCommand extends Command
{
    protected $signature = 'discover:create-collections {--min-videos=20} {--limit=100}';
    protected $description = 'Create auto-managed collections from popular discover landings';

    public function handle(SearchLandingService $landingService): int
    {
        $minVideos = (int) $this->option('min-videos');
        $limit = (int) $this->option('limit');

        $landings = SearchLanding::query()
            ->where('is_public', true)
            ->whereNull('collection_id')
            ->where('videos_count', '>=', $minVideos)
            ->orderByDesc('videos_count')
            ->limit($limit)
            ->get();

        $created = 0;
        foreach ($landings as $landing) {
            $collection = Collection::create([
                'name' => $landing->title,
                'slug' => $this->uniqueSlug($landing->slug . '-collection'),
                'description' => $landing->description ?: "Curated selection of videos related to {$landing->query}.",
                'is_public' => true,
                'is_auto_managed' => true,
                'language' => $landing->language ?? 'en',
            ]);

            $videos = $landingService->videosForQuery($landing->query, 50);
            if ($videos->isNotEmpty()) {
                $collection->videos()->syncWithoutDetaching($videos->pluck('id')->all());
            }

            $landing->update(['collection_id' => $collection->id]);
            $created++;
        }

        $this->info("Created {$created} collections from discover landings.");

        return self::SUCCESS;
    }

    private function uniqueSlug(string $baseSlug): string
    {
        $slug = Str::slug($baseSlug);
        $candidate = $slug;
        $suffix = 1;

        while ($candidate === '' || Collection::query()->where('slug', $candidate)->exists()) {
            $candidate = $slug . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }
}
