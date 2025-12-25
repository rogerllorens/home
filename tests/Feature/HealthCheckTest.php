<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_critical_routes_return_success(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Health Video',
            'seo_description' => 'Health description',
            'embed_ok' => true,
        ]);

        $directory = public_path('sitemaps');
        File::ensureDirectoryExists($directory);
        File::put($directory.'/index.xml', '<sitemapindex></sitemapindex>');

        $routes = [
            route('public.home'),
            route('public.search'),
            route('public.terms'),
            route('public.privacy'),
            route('public.takedown'),
            route('public.contact'),
            route('public.sitemap.index'),
            route('public.video', ['slug' => Str::slug($video->seo_title), 'id' => $video->id]),
        ];

        foreach ($routes as $route) {
            $this->get($route)->assertOk();
        }
    }
}
