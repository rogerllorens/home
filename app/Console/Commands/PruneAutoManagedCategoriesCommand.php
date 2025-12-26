<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\CategoryPageview;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneAutoManagedCategoriesCommand extends Command
{
    protected $signature = 'categories:prune-auto';
    protected $description = 'Disable low-performing auto-managed categories';

    public function handle(): int
    {
        $minViews = (int) config('categories_auto.min_views_per_month_for_keep', 10);
        $minVideos = (int) config('categories_auto.min_videos_for_keep', 8);
        $cutoff = now()->subDays(30);

        $viewsByCategory = CategoryPageview::query()
            ->select('category_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        $categories = Category::query()
            ->where('is_auto_managed', true)
            ->where('is_public', true)
            ->get();

        $pruned = 0;
        foreach ($categories as $category) {
            $views = (int) ($viewsByCategory[$category->id] ?? 0);
            $videosCount = $category->videos()->count();

            if ($views < $minViews && $videosCount < $minVideos) {
                $category->update(['is_public' => false]);
                $pruned++;
            }
        }

        $this->info("Pruned {$pruned} auto-managed categories.");

        return self::SUCCESS;
    }
}
