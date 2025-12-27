<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxonomyPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_index_page_loads(): void
    {
        $response = $this->get(route('public.categories', ['locale' => 'en']));

        $response->assertOk();
        $response->assertSee(trans('ui.nav.categories', [], 'en'));
        $response->assertSee('Couples');
    }

    public function test_tags_index_page_loads_with_popular_tag(): void
    {
        Video::factory()->create([
            'status' => VideoStatus::Published,
            'raw_tags' => ['focus'],
        ]);

        $response = $this->get(route('public.tags', ['locale' => 'en']));

        $response->assertOk();
        $response->assertSee('#focus');
    }

    public function test_tag_page_lists_matching_videos(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'raw_tags' => ['focus'],
        ]);

        $response = $this->get(route('public.tag', ['locale' => 'en', 'tag_slug' => 'focus']));

        $response->assertOk();
        $response->assertSee($video->title);
        $response->assertSee(trans('seo.tag.heading', ['tag' => 'Focus'], 'en'));
    }

    public function test_category_filters_by_duration(): void
    {
        $short = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'couples',
            'duration_seconds' => 120,
        ]);

        $long = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'couples',
            'duration_seconds' => 1200,
        ]);

        $response = $this->get(route('public.category', [
            'locale' => 'en',
            'category_slug' => 'couples',
            'duration' => 'short',
        ]));

        $response->assertOk();
        $response->assertSee($short->title);
        $response->assertDontSee($long->title);
    }

    public function test_category_page_includes_seo_block(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'couples',
        ]);

        $response = $this->get(route('public.category', ['locale' => 'en', 'category_slug' => 'couples']));

        $response->assertOk();
        $response->assertSee($video->title);
        $response->assertSee(trans('seo.category.heading', ['category' => 'Couples'], 'en'));
    }
}
