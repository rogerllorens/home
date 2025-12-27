<?php

namespace Tests\Feature;

use App\Models\SeoLanding;
use App\Models\SeoPageMetric;
use App\Models\SeoPageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ContentDecayCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_detects_and_refreshes_stale_pages(): void
    {
        config()->set('seo_decay.recent_weeks', 1);
        config()->set('seo_decay.stale_after_days', 1);
        config()->set('seo_decay.decline_threshold', 0.2);

        $landing = SeoLanding::create([
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
            'updated_at' => now()->subDays(3),
        ]);

        $url = route('public.discover', $landing->slug);

        SeoPageView::create([
            'page_type' => 'seo_landing',
            'page_id' => $landing->id,
            'url' => $url,
            'viewed_at' => now()->subWeeks(2),
        ]);
        SeoPageView::create([
            'page_type' => 'seo_landing',
            'page_id' => $landing->id,
            'url' => $url,
            'viewed_at' => now()->subWeeks(2)->addDay(),
        ]);
        SeoPageView::create([
            'page_type' => 'seo_landing',
            'page_id' => $landing->id,
            'url' => $url,
            'viewed_at' => now()->subDays(3),
        ]);

        Artisan::call('seo:detect-decay --refresh');

        $metric = SeoPageMetric::query()->where('page_id', $landing->id)->first();

        $this->assertNotNull($metric);
        $this->assertFalse($metric->is_stale);
        $this->assertNotNull($metric->last_content_refresh_at);
    }
}
