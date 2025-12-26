<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\CategoryCandidate;
use App\Services\CategoryAutoCreator;
use App\Services\Search\SearchLandingService;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DetectCategoryCandidatesCommand extends Command
{
    protected $signature = 'categories:detect-candidates {--days=}';
    protected $description = 'Detect strong search terms and create category candidates';

    public function handle(SearchLandingService $landingService, CategoryAutoCreator $autoCreator): int
    {
        $lookbackDays = (int) ($this->option('days') ?: config('categories_auto.lookback_days', 30));
        $minHits = (int) config('categories_auto.min_hits_for_candidate', 40);
        $minVideos = (int) config('categories_auto.min_videos_for_candidate', 8);
        $autoApprove = (bool) config('categories_auto.auto_approve', false);
        $minHitsAuto = (int) config('categories_auto.min_hits_for_auto_approve', 120);
        $minVideosAuto = (int) config('categories_auto.min_videos_for_auto_approve', 30);
        $bannedTerms = $this->normalizeList(config('categories_auto.banned_terms', []));

        $existingCategories = $this->existingCategorySlugs();

        $cutoff = now()->subDays($lookbackDays);
        $searchTerms = DB::table('search_queries')
            ->selectRaw('normalized_query, max(query) as query, count(*) as total')
            ->where('created_at', '>=', $cutoff)
            ->groupBy('normalized_query')
            ->get();

        $created = 0;
        foreach ($searchTerms as $row) {
            $normalized = (string) $row->normalized_query;
            $name = (string) $row->query;
            $hits = (int) $row->total;

            if ($normalized === '' || $hits < $minHits) {
                continue;
            }

            if ($this->isBanned($normalized, $bannedTerms)) {
                continue;
            }

            if ($existingCategories->contains($normalized)) {
                continue;
            }

            if (CategoryCandidate::query()
                ->where('normalized_name', $normalized)
                ->where('status', '!=', 'rejected')
                ->exists()
            ) {
                continue;
            }

            $videosCount = $landingService->countForQuery($normalized);
            if ($videosCount < $minVideos) {
                continue;
            }

            $parentCategoryId = $this->findParentCategoryId($normalized, $existingCategories);

            $status = 'candidate';
            if ($autoApprove && $hits >= $minHitsAuto && $videosCount >= $minVideosAuto) {
                $status = 'auto_approved';
            }

            $candidate = CategoryCandidate::updateOrCreate(
                ['slug' => Str::slug($normalized)],
                [
                    'name' => $name,
                    'source' => 'search',
                    'normalized_name' => $normalized,
                    'videos_count' => $videosCount,
                    'hits_last_30d' => $hits,
                    'status' => $status,
                    'is_subcategory' => $parentCategoryId !== null,
                    'parent_category_id' => $parentCategoryId,
                ]
            );

            if ($status === 'auto_approved') {
                $autoCreator->createFromCandidate($candidate, 'auto_approved');
            }
            $created++;
        }

        $tagCreated = $this->detectTagCandidates(
            $landingService,
            $autoCreator,
            $existingCategories,
            $bannedTerms,
            $minVideos,
            $autoApprove,
            $minVideosAuto
        );

        $this->info("Created or updated {$created} search candidates and {$tagCreated} tag candidates.");

        return self::SUCCESS;
    }

    private function detectTagCandidates(
        SearchLandingService $landingService,
        CategoryAutoCreator $autoCreator,
        Collection $existingCategories,
        array $bannedTerms,
        int $minVideos,
        bool $autoApprove,
        int $minVideosAuto
    ): int {
        $tagRows = $this->popularTags();
        $created = 0;

        foreach ($tagRows as $tag => $count) {
            $normalized = $this->normalizeText($tag);
            if ($normalized === '' || $this->isBanned($normalized, $bannedTerms)) {
                continue;
            }

            if ($existingCategories->contains($normalized)) {
                continue;
            }

            if (CategoryCandidate::query()
                ->where('normalized_name', $normalized)
                ->where('status', '!=', 'rejected')
                ->exists()
            ) {
                continue;
            }

            $videosCount = $landingService->countForQuery($normalized);
            if ($videosCount < $minVideos) {
                continue;
            }

            $status = ($autoApprove && $videosCount >= $minVideosAuto) ? 'auto_approved' : 'candidate';

            $candidate = CategoryCandidate::updateOrCreate(
                ['slug' => Str::slug($normalized)],
                [
                    'name' => $tag,
                    'source' => 'tag',
                    'normalized_name' => $normalized,
                    'videos_count' => $videosCount,
                    'hits_last_30d' => 0,
                    'status' => $status,
                    'is_subcategory' => false,
                    'parent_category_id' => null,
                ]
            );
            if ($status === 'auto_approved') {
                $autoCreator->createFromCandidate($candidate, 'auto_approved');
            }
            $created++;
        }

        return $created;
    }

    private function findParentCategoryId(string $normalized, Collection $existingCategories): ?int
    {
        foreach ($existingCategories as $categorySlug) {
            $pattern = '/\b' . preg_quote($categorySlug, '/') . '\b/u';
            if (preg_match($pattern, $normalized) && trim(str_replace($categorySlug, '', $normalized)) !== '') {
                $parent = Category::firstOrCreate(
                    ['slug' => Str::slug($categorySlug)],
                    [
                        'name' => Str::headline($categorySlug),
                        'normalized_name' => $categorySlug,
                        'is_auto_managed' => false,
                    ]
                );

                return $parent->id;
            }
        }

        return null;
    }

    private function popularTags(): array
    {
        if (DB::getDriverName() === 'pgsql') {
            $rows = DB::select("
                SELECT tag, count(*) as total
                FROM (
                    SELECT unnest(raw_tags) as tag
                    FROM videos
                    WHERE raw_tags IS NOT NULL
                ) as tags
                WHERE tag IS NOT NULL AND tag <> ''
                GROUP BY tag
            ");

            return collect($rows)->mapWithKeys(fn ($row) => [$row->tag => (int) $row->total])->all();
        }

        $rows = DB::table('videos')
            ->select('raw_tags')
            ->whereNotNull('raw_tags')
            ->get();

        $counts = [];
        foreach ($rows as $row) {
            foreach (($row->raw_tags ?? []) as $tag) {
                $tag = trim((string) $tag);
                if ($tag === '') {
                    continue;
                }
                $counts[$tag] = ($counts[$tag] ?? 0) + 1;
            }
        }

        return $counts;
    }

    private function normalizeText(string $text): string
    {
        $normalized = Str::lower(trim($text));
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        $normalized = Str::ascii($normalized);

        return trim((string) $normalized);
    }

    private function normalizeList(array $items): array
    {
        return collect($items)
            ->map(fn ($item) => $this->normalizeText((string) $item))
            ->filter()
            ->values()
            ->all();
    }

    private function existingCategorySlugs(): Collection
    {
        $configSlugs = collect(config('candidboys.categories_controlled', []))
            ->map(fn ($slug) => Str::lower($slug));

        $dbSlugs = Category::query()
            ->pluck('slug')
            ->map(fn ($slug) => Str::lower($slug));

        return $configSlugs
            ->merge($dbSlugs)
            ->filter()
            ->unique()
            ->values();
    }

    private function isBanned(string $normalized, array $bannedTerms): bool
    {
        foreach ($bannedTerms as $term) {
            if ($term !== '' && str_contains($normalized, $term)) {
                return true;
            }
        }

        return false;
    }
}
