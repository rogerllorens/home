<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class JsonLdStructuredDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_page_contains_video_object_json_ld(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Structured Video',
            'seo_description' => 'Structured description',
            'duration_seconds' => 120,
            'published_at' => now()->subDay(),
            'embed_ok' => true,
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('"@type":"VideoObject"', false);
        $response->assertSee('"duration"', false);
    }

    public function test_home_page_contains_item_list_json_ld(): void
    {
        Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now(),
        ]);

        $response = $this->get(route('public.home'));
        $response->assertOk();
        $response->assertSee('"@type":"ItemList"', false);
    }
}
