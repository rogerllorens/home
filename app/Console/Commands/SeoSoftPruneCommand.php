<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Collection;
use App\Models\SearchLanding;
use Illuminate\Console\Command;

class SeoSoftPruneCommand extends Command
{
    protected $signature = 'seo:soft-prune';
    protected $description = 'Soft prune low-performing auto-managed entities';

    public function handle(): int
    {
        $minViews = (int) config('seo_cleanup.min_pageviews_to_keep', 10);
        $minVideos = (int) config('seo_cleanup.min_videos_to_keep', 8);

        $categoryPruned = Category::query()
            ->where('is_auto_managed', true)
            ->where('is_public', true)
            ->get()
            ->filter(fn (Category $category) => $category->pageviews_last_30d < $minViews && $category->videos()->count() < $minVideos)
            ->each(fn (Category $category) => $category->update(['is_public' => false]))
            ->count();

        $collectionPruned = Collection::query()
            ->where('is_auto_managed', true)
            ->where('is_public', true)
            ->get()
            ->filter(fn (Collection $collection) => $collection->pageviews_last_30d < $minViews && $collection->videos()->count() < $minVideos)
            ->each(fn (Collection $collection) => $collection->update(['is_public' => false]))
            ->count();

        $landingPruned = SearchLanding::query()
            ->where('is_public', true)
            ->get()
            ->filter(fn (SearchLanding $landing) => $landing->pageviews_last_30d < $minViews && $landing->videos_count < $minVideos)
            ->each(fn (SearchLanding $landing) => $landing->update(['is_public' => false]))
            ->count();

        $this->info("Soft pruned categories={$categoryPruned}, collections={$collectionPruned}, landings={$landingPruned}.");

        return self::SUCCESS;
    }
}
