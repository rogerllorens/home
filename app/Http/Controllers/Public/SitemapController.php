<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
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

    private function serveFile(string $path): Response
    {
        $fullPath = public_path($path);

        if (!File::exists($fullPath)) {
            abort(404);
        }

        return response(File::get($fullPath), 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}
