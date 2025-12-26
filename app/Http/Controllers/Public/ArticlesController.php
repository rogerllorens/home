<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class ArticlesController extends Controller
{
    public function index(): View
    {
        $articles = $this->articles();

        return view('public.articles.index', [
            'articles' => $articles,
        ]);
    }

    public function show(string $slug): View
    {
        $articles = $this->articles();
        $article = collect($articles)->firstWhere('slug', $slug);

        if (!$article) {
            abort(404);
        }

        return view('public.articles.show', [
            'article' => $article,
        ]);
    }

    private function articles(): array
    {
        return config('candidboys.articles', []);
    }
}
