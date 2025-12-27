<?php

namespace Tests\Feature;

use App\Models\CtaClick;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CtaClickControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_cta_click_tracks_and_redirects(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/offer');
        config()->set('candidboys.monetization.utm.extra', ['utm_content' => 'cta']);

        $video = Video::factory()->create();
        $cta = app(CtaResolver::class)->ctaForKey('cams');

        $response = $this->get(route('public.cta.redirect', [
            'locale' => 'en',
            'cta' => $cta->public_id,
            'video' => $video->id,
            'origin' => 'video_detail',
            'placement' => 'video_detail',
        ]));

        $response->assertRedirect();
        $this->assertDatabaseHas('cta_clicks', [
            'video_id' => $video->id,
            'cta_id' => $cta->id,
            'cta_key' => 'cams',
        ]);

        $click = CtaClick::first();
        $this->assertNotNull($click?->click_id);
    }

    public function test_cta_click_invalid_key_returns_404(): void
    {
        $response = $this->get(route('public.cta.redirect', [
            'locale' => 'en',
            'cta' => 'invalid-id',
        ]));

        $response->assertNotFound();
    }
}
