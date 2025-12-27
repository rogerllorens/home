<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoJsonLdTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_object_includes_view_count_when_available(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'embed_ok' => true,
        ]);

        $video->forceFill(['views_total' => 123])->save();

        $slug = Str::slug($video->seo_title);

        $response = $this->get(route('public.video', ['slug' => $slug, 'id' => $video->id]));

        $response->assertOk();
        $response->assertSee('"interactionStatistic"', false);
        $response->assertSee('"userInteractionCount":123', false);
        $response->assertSee('"contentUrl"', false);
        $response->assertSee('"keywords"', false);
    }
}
