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
        $response = $this->get(route('public.categories'));

        $response->assertOk();
        $response->assertSee('Categories');
        $response->assertSee('Couples');
    }

    public function test_tags_index_page_loads_with_popular_tag(): void
    {
        Video::factory()->create([
            'status' => VideoStatus::Published,
            'raw_tags' => ['focus'],
        ]);

        $response = $this->get(route('public.tags'));

        $response->assertOk();
        $response->assertSee('#focus');
    }

    public function test_tag_page_lists_matching_videos(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'raw_tags' => ['focus'],
        ]);

        $response = $this->get(route('public.tag', 'focus'));

        $response->assertOk();
        $response->assertSee($video->title);
    }
}
