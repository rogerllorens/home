<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\SeoLanding;
use App\Models\TopicCluster;
use App\Models\Video;
use App\Services\Seo\InternalLinkingService;
use App\Services\Seo\SeoMetaVariantService;
use App\Services\Seo\SeoPageTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class TopicClusterController extends Controller
{
    public function show(
        string $locale,
        string $slug,
        SeoPageTracker $pageTracker,
        SeoMetaVariantService $metaVariants,
        InternalLinkingService $internalLinking,
        Request $request
    ): View
    {
        $cluster = TopicCluster::query()
            ->where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        $categories = collect($cluster->category_slugs ?? [])
            ->filter()
            ->values()
            ->all();
        $tags = collect($cluster->tag_slugs ?? [])
            ->filter()
            ->values()
            ->all();

        $videosQuery = Video::query()
            ->where('status', VideoStatus::Published->value)
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->when(!empty($categories) || !empty($tags), function ($query) use ($categories, $tags) {
                $query->where(function ($subQuery) use ($categories, $tags) {
                    if (!empty($categories)) {
                        $subQuery->whereIn('category_slug', $categories);
                    }

                    if (!empty($tags)) {
                        if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
                            foreach ($tags as $tag) {
                                $subQuery->orWhereRaw('raw_tags LIKE ?', ["%{$tag}%"]);
                            }
                        } else {
                            $subQuery->orWhereRaw('raw_tags && ARRAY[?]::text[]', [$tags]);
                        }
                    }
                });
            });

        $videos = $videosQuery
            ->orderByDesc('published_at')
            ->take(48)
            ->get();

        $seoLandings = SeoLanding::query()
            ->where('is_public', true)
            ->get()
            ->filter(function (SeoLanding $landing) use ($categories, $tags) {
                $params = $landing->params ?? [];
                $category = $params['category'] ?? null;
                $tag = $params['tag'] ?? null;

                return (!empty($categories) && $category && in_array($category, $categories, true))
                    || (!empty($tags) && $tag && in_array($tag, $tags, true));
            })
            ->map(function (SeoLanding $landing) {
                $url = $landing->type === 'top'
                    ? route('public.seo.top', [
                        'category' => $landing->params['category'] ?? 'all',
                        'duration' => $landing->params['duration'] ?? 'short',
                        'timeframe' => $landing->params['timeframe'] ?? 'this-week',
                    ])
                    : route('public.discover', $landing->slug);

                return [
                    'landing' => $landing,
                    'url' => $url,
                ];
            })
            ->values();

        $defaultTitle = Str::limit("{$cluster->name} | Candid Boys", (int) config('candidboys.seo.title_max', 70), '');
        $defaultDescription = Str::limit($cluster->intro ?? "Explora videos sobre {$cluster->name}.", (int) config('candidboys.seo.desc_max', 160), '');
        $meta = $metaVariants->select('theme', $cluster->id, $defaultTitle, $defaultDescription, $request);

        $pageTracker->track('theme', $cluster->id, $request);

        $linkedIntro = $internalLinking->linkify($cluster->intro ?? '', [
            'category' => $categories[0] ?? null,
            'tag' => $tags[0] ?? null,
        ]);

        return view('public.theme', [
            'cluster' => $cluster,
            'categories' => $categories,
            'tags' => $tags,
            'videos' => $videos,
            'seoLandings' => $seoLandings,
            'pageTitle' => $meta['title'],
            'pageDescription' => $meta['description'],
            'linkedIntro' => $linkedIntro,
        ]);
    }
}
