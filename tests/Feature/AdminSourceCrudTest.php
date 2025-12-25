<?php

namespace Tests\Feature;

use App\Enums\SourceType;
use App\Models\Source;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminSourceCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_disable_source(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $payload = [
            'name' => 'Test Source',
            'type' => SourceType::Manual->value,
            'feed_url' => 'https://example.com/feed.json',
            'auth_header' => 'Bearer token',
            'import_schedule_cron' => '0 0 * * *',
            'is_active' => true,
            'settings' => json_encode([
                'partner_links' => [
                    'cams' => [
                        'url' => 'https://override.example.com/cams',
                        'label' => 'VIP Cams',
                    ],
                ],
            ]),
        ];

        $response = $this->actingAs($admin)->post(route('admin.sources.store'), $payload);
        $response->assertRedirect(route('admin.sources.index'));

        $source = Source::first();
        $this->assertNotNull($source);

        $update = $this->actingAs($admin)->put(route('admin.sources.update', $source), [
            ...$payload,
            'is_active' => false,
        ]);
        $update->assertRedirect(route('admin.sources.index'));

        $source->refresh();
        $this->assertFalse($source->is_active);
    }

    public function test_source_cta_override_reflected_on_video_page(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');

        $source = Source::factory()->create([
            'settings' => [
                'partner_links' => [
                    'cams' => [
                        'url' => 'https://override.example.com/cams',
                        'label' => 'VIP Cams',
                    ],
                ],
            ],
        ]);

        $video = Video::factory()->for($source)->create([
            'seo_title' => 'Override Video',
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('VIP Cams');
    }
}
