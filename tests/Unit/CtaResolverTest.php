<?php

namespace Tests\Unit;

use App\Models\Source;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use App\Services\Videos\CtaPresenter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CtaResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolver_uses_category_template_and_source_overrides(): void
    {
        config()->set('candidboys.monetization.cta_templates', [
            'default' => 'Default template.',
            'romantic' => 'Romantic template.',
        ]);
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');
        config()->set('candidboys.monetization.partner_links.membership.url', 'https://partner.example.com/members');

        $source = Source::factory()->create([
            'settings' => [
                'partner_links' => [
                    'membership' => [
                        'url' => 'https://vip.example.com/members',
                        'label' => 'VIP Members',
                        'template' => 'VIP template.',
                    ],
                ],
            ],
        ]);

        $video = Video::factory()->for($source)->create([
            'category_slug' => 'romantic',
        ]);

        $resolved = app(CtaResolver::class)->resolve($video);

        $this->assertSame('https://partner.example.com/cams', $resolved['cams']['url']);
        $this->assertSame('Romantic template.', $resolved['cams']['description']);
        $this->assertSame('https://vip.example.com/members', $resolved['membership']['url']);
        $this->assertSame('VIP Members', $resolved['membership']['label']);
        $this->assertSame('VIP template.', $resolved['membership']['description']);
    }

    public function test_presenter_filters_missing_urls_and_builds_tracking_url(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');
        config()->set('candidboys.monetization.partner_links.membership.url', null);

        $video = Video::factory()->create();

        $ctas = app(CtaPresenter::class)->present($video, 'hero');

        $this->assertCount(1, $ctas);
        $this->assertSame('cams', $ctas[0]['key']);
        $this->assertStringContainsString("/r/{$video->id}/cams", $ctas[0]['track_url']);
        $this->assertStringContainsString('placement=hero', $ctas[0]['track_url']);
    }

    public function test_resolver_falls_back_to_default_template(): void
    {
        config()->set('candidboys.monetization.cta_templates', [
            'default' => 'Default template.',
        ]);
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');

        $video = Video::factory()->create([
            'category_slug' => 'unknown-category',
        ]);

        $resolved = app(CtaResolver::class)->resolve($video);

        $this->assertSame('Default template.', $resolved['cams']['description']);
    }

    public function test_resolver_uses_source_override_url(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');

        $source = Source::factory()->create([
            'settings' => [
                'partner_links' => [
                    'cams' => [
                        'url' => 'https://override.example.com/cams',
                    ],
                ],
            ],
        ]);

        $video = Video::factory()->for($source)->create();

        $resolved = app(CtaResolver::class)->resolve($video);

        $this->assertSame('https://override.example.com/cams', $resolved['cams']['url']);
    }
}
