<?php

namespace App\Services;

use App\Models\Category;
use App\Models\CategoryCandidate;
use App\Services\Search\SearchLandingService;
use Illuminate\Support\Str;

class CategoryAutoCreator
{
    public function __construct(private readonly SearchLandingService $searchService)
    {
    }

    public function createFromCandidate(CategoryCandidate $candidate, ?string $statusOverride = null): ?Category
    {
        $normalizedName = $candidate->normalized_name;
        $minVideos = (int) config('categories_auto.min_videos_for_candidate', 8);
        $maxVideos = (int) config('categories_auto.max_videos_per_category', 200);

        $videos = $this->searchService->videosForQuery($normalizedName, $maxVideos);
        $videosCount = $videos->count();

        if ($videosCount < $minVideos) {
            $candidate->update(['status' => 'rejected', 'videos_count' => $videosCount]);
            return null;
        }

        $existingCategory = Category::query()
            ->where('normalized_name', $normalizedName)
            ->first();

        if ($existingCategory) {
            $candidate->update([
                'status' => $statusOverride ?? 'approved',
                'videos_count' => $videosCount,
            ]);

            return $existingCategory;
        }

        if ($this->conflictsWithConfigCategory($normalizedName)) {
            $candidate->update(['status' => 'rejected']);
            return null;
        }

        $slug = $this->uniqueSlug($candidate->slug, $candidate->name);
        $parentId = $candidate->is_subcategory ? $candidate->parent_category_id : null;

        $category = Category::create([
            'name' => $candidate->name,
            'slug' => $slug,
            'normalized_name' => $normalizedName,
            'parent_id' => $parentId,
            'is_auto_managed' => true,
            'is_public' => true,
        ]);

        if ($videos->isNotEmpty()) {
            $category->videos()->syncWithoutDetaching($videos->pluck('id')->all());
        }

        $candidate->update([
            'status' => $statusOverride ?? 'approved',
            'videos_count' => $videosCount,
        ]);

        return $category;
    }

    private function conflictsWithConfigCategory(string $normalizedName): bool
    {
        $configSlugs = collect(config('candidboys.categories_controlled', []))
            ->map(fn ($slug) => Str::lower($slug));

        return $configSlugs->contains($normalizedName);
    }

    private function uniqueSlug(string $slug, string $name): string
    {
        $baseSlug = $slug !== '' ? $slug : Str::slug($name);
        if ($baseSlug === '') {
            $baseSlug = Str::slug($name);
        }
        $candidateSlug = $baseSlug;
        $suffix = 1;

        while ($candidateSlug === '' || $this->slugExists($candidateSlug)) {
            $candidateSlug = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        return $candidateSlug;
    }

    private function slugExists(string $slug): bool
    {
        if (Category::query()->where('slug', $slug)->exists()) {
            return true;
        }

        $configSlugs = collect(config('candidboys.categories_controlled', []))
            ->map(fn ($value) => Str::lower($value));

        return $configSlugs->contains(Str::lower($slug));
    }
}
