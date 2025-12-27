<?php

namespace App\Services\Seo;

use App\Models\Category;
use App\Models\SeoLanding;
use App\Models\SeoPageMetric;
use App\Models\SeoPageView;
use App\Models\TopicCluster;
use App\Models\Video;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SeoDecayService
{
    public function analyze(): Collection
    {
        $recentWeeks = (int) config('seo_decay.recent_weeks', 4);
        $staleAfterDays = (int) config('seo_decay.stale_after_days', 21);
        $declineThreshold = (float) config('seo_decay.decline_threshold', 0.25);

        $recentStart = now()->subWeeks($recentWeeks);
        $previousStart = now()->subWeeks($recentWeeks * 2);

        $pages = $this->seoPages();
        $stalePages = collect();

        foreach ($pages as $page) {
            $recentViews = SeoPageView::query()
                ->where('page_type', $page['type'])
                ->when($page['id'] !== null, fn ($query) => $query->where('page_id', $page['id']))
                ->when($page['id'] === null, fn ($query) => $query->where('url', $page['url']))
                ->where('viewed_at', '>=', $recentStart)
                ->count();

            $previousViews = SeoPageView::query()
                ->where('page_type', $page['type'])
                ->when($page['id'] !== null, fn ($query) => $query->where('page_id', $page['id']))
                ->when($page['id'] === null, fn ($query) => $query->where('url', $page['url']))
                ->whereBetween('viewed_at', [$previousStart, $recentStart])
                ->count();

            $lastRefresh = $page['last_refresh'] ?? null;
            $isDeclining = $previousViews > 0 && ($recentViews / $previousViews) < (1 - $declineThreshold);
            $isStale = $isDeclining && (!$lastRefresh || $lastRefresh->lt(now()->subDays($staleAfterDays)));

            $metric = SeoPageMetric::updateOrCreate([
                'page_type' => $page['type'],
                'page_id' => $page['id'],
                'url' => $page['url'],
            ], [
                'last_content_refresh_at' => $lastRefresh,
                'views_recent' => $recentViews,
                'views_previous' => $previousViews,
                'is_stale' => $isStale,
                'last_checked_at' => now(),
            ]);

            if ($isStale) {
                $stalePages->push($metric);
            }
        }

        return $stalePages;
    }

    public function refresh(SeoPageMetric $metric): void
    {
        if ($metric->page_type === 'seo_landing' && $metric->page_id) {
            $landing = SeoLanding::find($metric->page_id);
            if ($landing) {
                if (!str_contains($landing->description_template, 'Últimos')) {
                    $landing->description_template = 'Últimos videos {duration} de {category} y {tag}.';
                }
                $landing->touch();
                $landing->save();
            }
        }

        if ($metric->page_type === 'theme' && $metric->page_id) {
            $cluster = TopicCluster::find($metric->page_id);
            if ($cluster) {
                if (!$cluster->intro) {
                    $cluster->intro = "Últimos videos sobre {$cluster->name}.";
                }
                $cluster->touch();
                $cluster->save();
            }
        }

        $metric->update([
            'is_stale' => false,
            'last_content_refresh_at' => now(),
        ]);
    }

    private function seoPages(): Collection
    {
        $pages = collect();

        SeoLanding::query()
            ->where('is_public', true)
            ->get()
            ->each(function (SeoLanding $landing) use ($pages) {
                $url = $landing->type === 'top'
                    ? route('public.seo.top', [
                        'category' => $landing->params['category'] ?? 'all',
                        'duration' => $landing->params['duration'] ?? 'short',
                        'timeframe' => $landing->params['timeframe'] ?? 'this-week',
                    ])
                    : route('public.discover', $landing->slug);

                $pages->push([
                    'type' => 'seo_landing',
                    'id' => $landing->id,
                    'url' => $url,
                    'last_refresh' => $landing->updated_at,
                ]);
            });

        TopicCluster::query()
            ->where('is_public', true)
            ->get()
            ->each(function (TopicCluster $cluster) use ($pages) {
                $pages->push([
                    'type' => 'theme',
                    'id' => $cluster->id,
                    'url' => route('public.theme', $cluster->slug),
                    'last_refresh' => $cluster->updated_at,
                ]);
            });

        Category::query()
            ->where('is_public', true)
            ->get(['id', 'slug', 'updated_at'])
            ->each(function (Category $category) use ($pages) {
                $pages->push([
                    'type' => 'category',
                    'id' => $category->id,
                    'url' => route('public.category', $category->slug),
                    'last_refresh' => $category->updated_at,
                ]);
            });

        $tags = $this->allTags();
        foreach ($tags as $tag) {
            $pages->push([
                'type' => 'tag',
                'id' => null,
                'url' => route('public.tag', $tag),
                'last_refresh' => null,
            ]);
        }

        $articles = config('candidboys.articles', []);
        foreach ($articles as $article) {
            if (empty($article['slug'])) {
                continue;
            }

            $pages->push([
                'type' => 'article',
                'id' => null,
                'url' => route('public.articles.show', $article['slug']),
                'last_refresh' => null,
            ]);
        }

        return $pages;
    }

    public function allTags(): array
    {
        if (DB::getDriverName() === 'sqlite') {
            return Video::query()
                ->whereNotNull('raw_tags')
                ->get(['raw_tags'])
                ->flatMap(fn (Video $video) => $video->raw_tags ?? [])
                ->unique()
                ->values()
                ->all();
        }

        return DB::table('videos')
            ->selectRaw('distinct unnest(raw_tags) as tag')
            ->whereNotNull('raw_tags')
            ->pluck('tag')
            ->filter()
            ->values()
            ->all();
    }
}
