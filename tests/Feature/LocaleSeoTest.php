<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LocaleSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_locales_include_hreflang_and_canonical(): void
    {
        $responseEn = $this->get(route('public.home', ['locale' => 'en']));

        $responseEn->assertOk();
        $responseEn->assertSee(trans('ui.home.recently_added', [], 'en'));
        $responseEn->assertSee('<link rel="canonical" href="' . route('public.home', ['locale' => 'en']) . '">', false);
        $responseEn->assertSee('<link rel="alternate" hreflang="en" href="' . route('public.home', ['locale' => 'en']) . '">', false);
        $responseEn->assertSee('<link rel="alternate" hreflang="es" href="' . route('public.home', ['locale' => 'es']) . '">', false);

        $responseEs = $this->get(route('public.home', ['locale' => 'es']));

        $responseEs->assertOk();
        $responseEs->assertSee(trans('ui.home.recently_added', [], 'es'));
        $responseEs->assertSee('<link rel="canonical" href="' . route('public.home', ['locale' => 'es']) . '">', false);
    }

    public function test_category_page_locales_include_hreflang_and_canonical(): void
    {
        Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
            'category_slug' => 'romantic',
        ]);

        $heading = Str::headline('romantic');
        $routeEn = route('public.category', ['locale' => 'en', 'category_slug' => 'romantic']);
        $routeEs = route('public.category', ['locale' => 'es', 'category_slug' => 'romantic']);

        $responseEn = $this->get($routeEn);

        $responseEn->assertOk();
        $responseEn->assertSee(trans('ui.category.videos_in', ['category' => $heading], 'en'));
        $responseEn->assertSee('<link rel="canonical" href="' . $routeEn . '">', false);
        $responseEn->assertSee('<link rel="alternate" hreflang="en" href="' . $routeEn . '">', false);
        $responseEn->assertSee('<link rel="alternate" hreflang="es" href="' . $routeEs . '">', false);

        $responseEs = $this->get($routeEs);

        $responseEs->assertOk();
        $responseEs->assertSee(trans('ui.category.videos_in', ['category' => $heading], 'es'));
        $responseEs->assertSee('<link rel="canonical" href="' . $routeEs . '">', false);
    }

    public function test_video_page_locales_include_hreflang_and_canonical(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
            'title' => 'Test Video',
            'category_slug' => 'romantic',
        ]);

        $slug = Str::slug($video->seo_title ?: $video->title);
        $routeEn = route('public.video', ['locale' => 'en', 'slug' => $slug, 'id' => $video->id]);
        $routeEs = route('public.video', ['locale' => 'es', 'slug' => $slug, 'id' => $video->id]);

        $responseEn = $this->get($routeEn);

        $responseEn->assertOk();
        $responseEn->assertSee(trans('ui.video.related', [], 'en'));
        $responseEn->assertSee('<link rel="canonical" href="' . $routeEn . '">', false);
        $responseEn->assertSee('<link rel="alternate" hreflang="en" href="' . $routeEn . '">', false);
        $responseEn->assertSee('<link rel="alternate" hreflang="es" href="' . $routeEs . '">', false);

        $responseEs = $this->get($routeEs);

        $responseEs->assertOk();
        $responseEs->assertSee(trans('ui.video.related', [], 'es'));
        $responseEs->assertSee('<link rel="canonical" href="' . $routeEs . '">', false);
    }
}
