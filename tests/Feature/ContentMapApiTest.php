<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Category;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentMapApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_map_endpoint_returns_categories_tags_and_relations(): void
    {
        Category::create([
            'name' => 'Sports',
            'slug' => 'sports',
            'normalized_name' => 'sports',
            'is_public' => true,
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'sports',
            'raw_tags' => ['action', 'fun'],
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'sports',
            'raw_tags' => ['action'],
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'travel',
            'raw_tags' => ['adventure'],
        ]);

        $response = $this->get('/api/content-map');

        $response->assertOk();
        $response->assertJsonStructure([
            'categories',
            'tags',
            'relations',
        ]);
        $response->assertJsonFragment([
            'slug' => 'sports',
            'label' => 'Sports',
            'total' => 2,
        ]);
        $response->assertJsonFragment([
            'tag' => 'action',
            'total' => 2,
        ]);
        $response->assertJsonFragment([
            'category_slug' => 'sports',
            'tag' => 'action',
            'total' => 2,
        ]);
    }
}
