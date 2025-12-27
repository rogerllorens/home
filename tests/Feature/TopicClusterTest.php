<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Category;
use App\Models\TopicCluster;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TopicClusterTest extends TestCase
{
    use RefreshDatabase;

    public function test_theme_hub_renders_cluster_content(): void
    {
        TopicCluster::create([
            'name' => 'Summer Fun',
            'slug' => 'summer-fun',
            'h1' => 'Summer Fun Hub',
            'category_slugs' => ['sports'],
            'tag_slugs' => ['action'],
            'intro' => 'All about summer fun.',
            'language' => 'es',
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'sports',
            'raw_tags' => ['action'],
        ]);

        $response = $this->get(route('public.theme', 'summer-fun'));

        $response->assertOk();
        $response->assertSee('Summer Fun Hub');
        $response->assertSee('Sports');
    }

    public function test_category_page_links_to_cluster(): void
    {
        Category::create([
            'name' => 'Sports',
            'slug' => 'sports',
            'normalized_name' => 'sports',
            'is_public' => true,
        ]);

        TopicCluster::create([
            'name' => 'Sports Universe',
            'slug' => 'sports-universe',
            'category_slugs' => ['sports'],
            'tag_slugs' => [],
            'language' => 'es',
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'sports',
        ]);

        $response = $this->get(route('public.category', 'sports'));

        $response->assertOk();
        $response->assertSee(route('public.theme', 'sports-universe'));
    }

    public function test_tag_page_links_to_cluster(): void
    {
        TopicCluster::create([
            'name' => 'Action Hub',
            'slug' => 'action-hub',
            'category_slugs' => [],
            'tag_slugs' => ['action'],
            'language' => 'es',
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'raw_tags' => ['action'],
        ]);

        $response = $this->get(route('public.tag', 'action'));

        $response->assertOk();
        $response->assertSee(route('public.theme', 'action-hub'));
    }
}
