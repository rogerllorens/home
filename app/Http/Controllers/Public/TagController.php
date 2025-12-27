<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Seo\SeoMetaVariantService;
use App\Services\Seo\SeoPageTracker;
use App\Services\Seo\TopicClusterMatcher;
use App\Services\Seo\InternalLinkingService;
use App\Support\PublicCache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TagController extends Controller
{
    public function __invoke(
        string $locale,
        string $tagSlug,
        TopicClusterMatcher $clusterMatcher,
        SeoPageTracker $pageTracker,
        SeoMetaVariantService $metaVariants,
        InternalLinkingService $internalLinking,
        Request $request
    ): View
    {
        $page = (int) request()->query('page', 1);
        $cacheKey = PublicCache::key("tag:{$tagSlug}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($tagSlug) {
            $query = Video::published();

            if (DB::getDriverName() === 'sqlite') {
                $query->whereRaw('raw_tags LIKE ?', ["%{$tagSlug}%"]);
            } else {
                $query->whereRaw('? = ANY(raw_tags)', [$tagSlug]);
            }

            $videos = $query->orderByDesc('published_at')
                ->paginate(18)
                ->withQueryString();

            $heading = Str::headline($tagSlug);
            $introMap = config('candidboys.taxonomy_intros.tags', []);
            $description = $introMap[$tagSlug] ?? "Videos destacados con el tag {$heading}.";

            return compact('videos', 'heading', 'description');
        });

        $defaultTitle = Str::limit($payload['heading'] . ' | Candid Boys', (int) config('candidboys.seo.title_max', 70), '');
        $defaultDescription = Str::limit($payload['description'], (int) config('candidboys.seo.desc_max', 160), '');
        $meta = $metaVariants->select('tag', null, $defaultTitle, $defaultDescription, $request);

        $pageTracker->track('tag', null, $request);

        $linkedDescription = $internalLinking->linkify($payload['description'], [
            'tag' => $tagSlug,
        ]);

        return view('public.tag', [
            ...$payload,
            'tagSlug' => $tagSlug,
            'cluster' => $clusterMatcher->forTag($tagSlug),
            'pageTitle' => $meta['title'],
            'pageDescription' => $meta['description'],
            'linkedDescription' => $linkedDescription,
        ]);
    }
}
