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
}
