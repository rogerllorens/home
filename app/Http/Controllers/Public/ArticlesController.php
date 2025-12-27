<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Seo\InternalLinkingService;
use App\Services\Seo\SeoPageTracker;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ArticlesController extends Controller
{
    public function index(InternalLinkingService $internalLinking): View
    {
        $articles = collect($this->articles())
            ->map(function (array $article) use ($internalLinking) {
                $article['linked_summary'] = $internalLinking->linkify($article['summary'] ?? '');
                return $article;
            })
            ->all();

        return view('public.articles.index', [
            'articles' => $articles,
        ]);
    }

    public function show(
        string $locale,
        string $slug,
        InternalLinkingService $internalLinking,
        SeoPageTracker $pageTracker,
        Request $request
    ): View
    {
        $articles = $this->articles();
        $article = collect($articles)->firstWhere('slug', $slug);

        if (!$article) {
            abort(404);
        }

        $article['linked_summary'] = $internalLinking->linkify($article['summary'] ?? '');
        $article['sections'] = collect($article['sections'] ?? [])
            ->map(function (array $section) use ($internalLinking) {
                $section['linked_body'] = $internalLinking->linkify($section['body'] ?? '');
                return $section;
            })
            ->all();

        $pageTracker->track('article', null, $request);

        return view('public.articles.show', [
            'article' => $article,
        ]);
    }

    private function articles(): array
    {
        return config('candidboys.articles', []);
    }
}
