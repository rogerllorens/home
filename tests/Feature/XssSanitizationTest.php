<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class XssSanitizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_embed_html_is_sanitized(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'embed_url' => null,
            'embed_html' => '<div><script>alert(1)</script><img src="x" onerror="alert(2)"></div>',
            'seo_title' => 'XSS Video',
            'embed_ok' => true,
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertDontSee('<script', false);
        $response->assertDontSee('onerror=', false);
    }

    public function test_iframe_disallows_event_handlers_and_js_urls(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'embed_url' => null,
            'embed_html' => '<iframe src=\"javascript:alert(1)\" onload=\"alert(2)\" allowfullscreen></iframe>',
            'seo_title' => 'Unsafe iframe',
            'embed_ok' => true,
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertDontSee('javascript:', false);
        $response->assertDontSee('onload=', false);
    }
}
