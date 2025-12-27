<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Category;
use App\Models\SeoLanding;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoLandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_discover_seo_landing_renders_videos_and_faq(): void
    {
        config()->set('seo_landings.min_videos', 1);

        Category::create([
            'name' => 'Sports',
            'slug' => 'sports',
            'normalized_name' => 'sports',
            'is_public' => true,
        ]);

        SeoLanding::create([
            'slug' => 'sports-action-short',
            'type' => 'discover',
            'params' => [
                'category' => 'sports',
                'tag' => 'action',
                'duration' => 'short',
            ],
            'title_template' => 'Videos {duration} de {category} y {tag}',
            'description_template' => 'Descubre videos {duration} sobre {category}.',
            'language' => 'es',
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'sports',
            'raw_tags' => ['action'],
            'duration_seconds' => 120,
        ]);

        $response = $this->get(route('public.discover', 'sports-action-short'));

        $response->assertOk();
        $response->assertSee('Videos cortos');
        $response->assertSee('Preguntas frecuentes');
    }

    public function test_top_seo_landing_route_renders(): void
    {
        config()->set('seo_landings.min_videos', 1);

        SeoLanding::create([
            'slug' => 'sports/short/this-week',
            'type' => 'top',
            'params' => [
                'category' => 'sports',
                'duration' => 'short',
                'timeframe' => 'this-week',
            ],
            'title_template' => 'Top {category} {duration}',
            'description_template' => 'Ranking de {category} {duration}.',
            'language' => 'es',
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'sports',
            'duration_seconds' => 120,
            'published_at' => now()->subDays(2),
        ]);

        $response = $this->get(route('public.seo.top', [
            'category' => 'sports',
            'duration' => 'short',
            'timeframe' => 'this-week',
        ]));

        $response->assertOk();
        $response->assertSee('Top');
    }
}
