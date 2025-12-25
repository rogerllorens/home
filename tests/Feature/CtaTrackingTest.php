<?php

namespace Tests\Feature;

use App\Models\CtaClick;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CtaTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_cta_tracking_creates_click_and_redirects(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/offer');

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
            'placement' => 'video_detail',
        ]);

        $click = CtaClick::first();
        $this->assertNotNull($click?->click_id);
    }

    public function test_cta_tracking_returns_404_for_invalid_key(): void
    {
        $video = Video::factory()->create();

        $response = $this->get(route('public.cta.track', [
            'video' => $video->id,
            'ctaKey' => 'invalid',
        ]));

        $response->assertNotFound();
    }

    public function test_cta_tracking_returns_404_for_invalid_video(): void
    {
        $response = $this->get(route('public.cta.track', [
            'video' => 9999,
            'ctaKey' => 'cams',
        ]));

        $response->assertNotFound();
    }

    public function test_cta_tracking_appends_utm_parameters(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/offer?ref=abc');
        config()->set('candidboys.monetization.utm.source', 'campaign-source');
        config()->set('candidboys.monetization.utm.medium', 'banner');

        $video = Video::factory()->create();

        $response = $this->get(route('public.cta.track', [
            'video' => $video->id,
            'ctaKey' => 'cams',
            'placement' => 'home',
        ]));

        $response->assertRedirect();
        $redirectUrl = $response->headers->get('Location');

        $this->assertNotNull($redirectUrl);
        $this->assertStringContainsString('utm_source=campaign-source', $redirectUrl);
        $this->assertStringContainsString('utm_medium=banner', $redirectUrl);
        $this->assertStringContainsString('utm_campaign=cams', $redirectUrl);
        $this->assertStringContainsString('click_id=', $redirectUrl);
        $this->assertStringContainsString('ref=abc', $redirectUrl);
    }
}
