<?php

namespace Tests\Feature;

use App\Models\CtaClick;
use App\Models\Video;
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

        $response = $this->get(route('public.cta.track', [
            'video' => $video->id,
            'ctaKey' => 'cams',
            'placement' => 'video_detail',
        ]));

        $response->assertRedirect();
        $this->assertDatabaseHas('cta_clicks', [
            'video_id' => $video->id,
            'cta_key' => 'cams',
        ]);

        $click = CtaClick::first();
        $this->assertNotNull($click?->click_id);
    }

    public function test_cta_click_invalid_key_returns_404(): void
    {
        $video = Video::factory()->create();

        $response = $this->get(route('public.cta.track', [
            'video' => $video->id,
            'ctaKey' => 'invalid',
        ]));

        $response->assertNotFound();
    }
}
