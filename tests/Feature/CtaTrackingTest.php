<?php

namespace Tests\Feature;

use App\Models\CtaClick;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CtaTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_cta_tracking_creates_click_and_redirects(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/offer');

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
            'placement' => 'video_detail',
        ]);

        $click = CtaClick::first();
        $this->assertNotNull($click?->click_id);
    }

    public function test_cta_tracking_returns_404_for_invalid_key(): void
    {
        $response = $this->get(route('public.cta.redirect', [
            'locale' => 'en',
            'cta' => 'invalid-id',
        ]));

        $response->assertNotFound();
    }

    public function test_cta_tracking_returns_404_for_invalid_video(): void
    {
        $cta = app(CtaResolver::class)->ctaForKey('cams');
        $response = $this->get(route('public.cta.redirect', [
            'locale' => 'en',
            'cta' => $cta->public_id,
            'video' => 9999,
        ]));

        $response->assertNotFound();
    }

    public function test_cta_tracking_appends_utm_parameters(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/offer?ref=abc');
        config()->set('candidboys.monetization.utm.source', 'campaign-source');
        config()->set('candidboys.monetization.utm.medium', 'banner');
        config()->set('candidboys.monetization.utm.extra', [
            'utm_content' => 'hero',
            'utm_term' => 'summer',
        ]);

        $video = Video::factory()->create();
        $cta = app(CtaResolver::class)->ctaForKey('cams');

        $response = $this->get(route('public.cta.redirect', [
            'locale' => 'en',
            'cta' => $cta->public_id,
            'video' => $video->id,
            'origin' => 'home',
            'placement' => 'home',
        ]));

        $response->assertRedirect();
        $redirectUrl = $response->headers->get('Location');

        $this->assertNotNull($redirectUrl);
        $this->assertStringContainsString('utm_source=campaign-source', $redirectUrl);
        $this->assertStringContainsString('utm_medium=banner', $redirectUrl);
        $this->assertStringContainsString('utm_campaign=cams', $redirectUrl);
        $this->assertStringContainsString('utm_content=hero', $redirectUrl);
        $this->assertStringContainsString('utm_term=summer', $redirectUrl);
        $this->assertStringContainsString('click_id=', $redirectUrl);
        $this->assertStringContainsString('ref=abc', $redirectUrl);
    }

    public function test_cta_tracking_preserves_existing_utm_values(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/offer?utm_source=existing&ref=abc');
        config()->set('candidboys.monetization.utm.source', 'campaign-source');
        config()->set('candidboys.monetization.utm.medium', 'banner');

        $video = Video::factory()->create();
        $cta = app(CtaResolver::class)->ctaForKey('cams');

        $response = $this->get(route('public.cta.redirect', [
            'locale' => 'en',
            'cta' => $cta->public_id,
            'video' => $video->id,
            'origin' => 'video_detail',
        ]));

        $response->assertRedirect();
        $redirectUrl = $response->headers->get('Location');

        $this->assertNotNull($redirectUrl);
        $this->assertStringContainsString('utm_source=existing', $redirectUrl);
        $this->assertStringContainsString('utm_medium=banner', $redirectUrl);
        $this->assertStringContainsString('utm_campaign=cams', $redirectUrl);
        $this->assertStringContainsString('click_id=', $redirectUrl);
        $this->assertStringContainsString('ref=abc', $redirectUrl);
    }
}
