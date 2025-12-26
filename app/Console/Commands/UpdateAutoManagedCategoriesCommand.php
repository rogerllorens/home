<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Services\Search\SearchLandingService;
use Illuminate\Console\Command;

class UpdateAutoManagedCategoriesCommand extends Command
{
    protected $signature = 'categories:update-auto {--limit=200}';
    protected $description = 'Refresh videos for auto-managed categories';

    public function handle(SearchLandingService $searchService): int
    {
        $limit = (int) $this->option('limit');
        $maxVideos = (int) config('categories_auto.max_videos_per_category', 200);

        $categories = Category::query()
            ->where('is_auto_managed', true)
            ->where('is_public', true)
            ->limit($limit)
            ->get();

        foreach ($categories as $category) {
            $videos = $searchService->videosForQuery($category->normalized_name, $maxVideos);
            if ($videos->isNotEmpty()) {
                $category->videos()->syncWithoutDetaching($videos->pluck('id')->all());
            }
        }

        $this->info("Updated {$categories->count()} auto-managed categories.");

        return self::SUCCESS;
    }
}
