<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class SitemapController extends Controller
{
    public function index(): Response
    {
        return $this->serveFile('sitemaps/index.xml');
    }

    public function videos(string $file): Response
    {
        return $this->serveFile("sitemaps/videos-{$file}");
    }

    public function categories(string $file): Response
    {
        return $this->serveFile("sitemaps/categories-{$file}");
    }

    public function tags(string $file): Response
    {
        return $this->serveFile("sitemaps/tags-{$file}");
    }

    public function discover(string $file): Response
    {
        return $this->serveFile("sitemaps/discover-{$file}");
    }

    private function serveFile(string $path): Response
    {
        $fullPath = public_path($path);

        if (!File::exists($fullPath)) {
            abort(404);
        }

        $cacheKey = 'sitemap:'.md5($path).':'.File::lastModified($fullPath);
        $contents = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($fullPath) {
            return File::get($fullPath);
        });

        return response($contents, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}
