<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\CategoryPageview;
use App\Models\Collection;
use App\Models\CollectionPageview;
use App\Models\SearchLanding;
use App\Models\LandingPageview;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateSeoMetricsCommand extends Command
{
    protected $signature = 'seo:update-landing-metrics';
    protected $description = 'Update 30-day pageview metrics for categories, collections, and landings';

    public function handle(): int
    {
        $cutoff = now()->subDays(30);

        $categoryViews = CategoryPageview::query()
            ->select('category_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        foreach (Category::query()->get(['id']) as $category) {
            $count = (int) ($categoryViews[$category->id] ?? 0);
            $category->update([
                'pageviews_last_30d' => $count,
                'ctr_affiliate_last_30d' => null,
            ]);
        }

        $collectionViews = CollectionPageview::query()
            ->select('collection_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->groupBy('collection_id')
            ->pluck('total', 'collection_id');

        foreach (Collection::query()->get(['id']) as $collection) {
            $count = (int) ($collectionViews[$collection->id] ?? 0);
            $collection->update([
                'pageviews_last_30d' => $count,
                'ctr_affiliate_last_30d' => null,
            ]);
        }

        $landingViews = LandingPageview::query()
            ->select('search_landing_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->groupBy('search_landing_id')
            ->pluck('total', 'search_landing_id');

        foreach (SearchLanding::query()->get(['id']) as $landing) {
            $count = (int) ($landingViews[$landing->id] ?? 0);
            $landing->update([
                'pageviews_last_30d' => $count,
                'ctr_affiliate_last_30d' => null,
            ]);
        }

        $this->info('SEO metrics updated.');

        return self::SUCCESS;
    }
}
