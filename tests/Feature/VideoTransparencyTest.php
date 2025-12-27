<?php

namespace Tests\Feature;

use App\Enums\VideoModerationStatus;
use App\Enums\VideoStatus;
use App\Models\Source;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoTransparencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_transparency_tags_render_for_video(): void
    {
        app()->setLocale('en');

        $source = Source::factory()->create([
            'is_verified' => true,
        ]);

        $video = Video::factory()->create([
            'source_id' => $source->id,
            'status' => VideoStatus::Published,
            'moderation_status' => VideoModerationStatus::Approved,
            'is_manual_upload' => true,
            'has_takedown_contact' => true,
        ]);

        $slug = Str::slug($video->seo_title ?: $video->title);

        $response = $this->get(route('public.video', ['slug' => $slug, 'id' => $video->id]));

        $response->assertOk();
        $response->assertSee(__('ui.video.transparency.title'));
        $response->assertSee(__('ui.video.transparency.tags.verified_source.label'));
        $response->assertSee(__('ui.video.transparency.tags.moderation_reviewed.label'));
        $response->assertSee(__('ui.video.transparency.tags.manual_upload.label'));
        $response->assertSee(__('ui.video.transparency.tags.fast_takedown.label'));
        $response->assertDontSee(__('ui.video.transparency.tags.auto_imported.label'));
    }
}
