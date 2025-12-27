<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoDetailPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_detail_page_shows_metadata_ctas_and_related(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Hero title',
            'seo_description' => 'Hero description',
            'published_at' => now()->subDays(2),
            'embed_ok' => true,
        ]);

        $related = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee($video->title);
        $response->assertSee('Featured offers');
        $response->assertSee('Basado en lo que has visto');
        $response->assertSee($related->title);
    }

    public function test_unavailable_video_shows_unavailable_notice(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Broken,
            'seo_title' => 'Broken title',
            'published_at' => now()->subDay(),
            'embed_ok' => false,
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('Video unavailable.');
    }

    public function test_video_page_displays_duration_views_and_tags(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Focus title',
            'published_at' => now()->subDay(),
            'duration_seconds' => 90,
            'raw_tags' => ['focus'],
        ]);

        $video->forceFill(['views_total' => 1200])->save();

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('01:30');
        $response->assertSee('1.2K views');
        $response->assertSee('#focus');
    }

    public function test_video_page_shows_play_next_and_category_section(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'featured',
        ]);

        $next = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'featured',
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('Siguiente recomendado');
        $response->assertSee('Más de esta categoría');
        $response->assertSee($next->title);
    }
}
