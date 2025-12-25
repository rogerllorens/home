<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeatureToggleTest extends TestCase
{
    use RefreshDatabase;

    public function test_cta_block_hidden_when_no_partner_urls(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', null);
        config()->set('candidboys.monetization.partner_links.membership.url', null);
        config()->set('candidboys.monetization.partner_links.dating.url', null);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'No CTA Video',
            'embed_ok' => true,
        ]);

        $response = $this->get(route('public.video', [
            'slug' => \Illuminate\Support\Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertDontSee('Featured offers');
    }

    public function test_contact_page_shows_captcha_when_enabled(): void
    {
        config()->set('candidboys.security.captcha_enabled', true);
        config()->set('candidboys.security.captcha_site_key', 'site-key');

        $response = $this->get(route('public.contact'));

        $response->assertOk();
        $response->assertSee('g-recaptcha', false);
    }
}
