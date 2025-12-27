<?php

namespace Tests\Feature;

use App\Enums\JourneyStatus;
use App\Enums\VideoStatus;
use App\Models\Journey;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JourneyPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_journey_page_lists_videos_in_order(): void
    {
        $journey = Journey::factory()->create([
            'status' => JourneyStatus::Published,
        ]);

        $first = Video::factory()->create([
            'status' => VideoStatus::Published,
            'title' => 'First video',
        ]);
        $second = Video::factory()->create([
            'status' => VideoStatus::Published,
            'title' => 'Second video',
        ]);

        $journey->videos()->sync([
            $first->id => ['position' => 1],
            $second->id => ['position' => 2],
        ]);

        $response = $this->get(route('public.journeys.show', ['locale' => 'en', 'slug' => $journey->slug]));

        $response->assertOk();
        $response->assertSee('First video');
        $response->assertSee('Second video');
    }

    public function test_video_page_mentions_journey_context(): void
    {
        $journey = Journey::factory()->create([
            'status' => JourneyStatus::Published,
            'title' => 'Evening Flow',
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'title' => 'Journey video',
        ]);

        $journey->videos()->sync([$video->id => ['position' => 1]]);

        $slug = Str::slug($video->seo_title ?: $video->title);

        $response = $this->get(route('public.video', [
            'locale' => 'en',
            'slug' => $slug,
            'id' => $video->id,
            'journey' => $journey->slug,
        ]));

        $response->assertOk();
        $response->assertSee(__('ui.video.journey.title'));
        $response->assertSee('Evening Flow');
    }
}
