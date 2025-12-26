<?php

namespace Tests\Feature;

use App\Enums\VideoModerationStatus;
use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_review_videos_are_hidden_from_public_pages(): void
    {
        $approved = Video::factory()->create([
            'status' => VideoStatus::Published,
            'moderation_status' => VideoModerationStatus::Approved,
            'published_at' => now(),
        ]);

        $pending = Video::factory()->create([
            'status' => VideoStatus::Published,
            'moderation_status' => VideoModerationStatus::PendingReview,
            'published_at' => now(),
        ]);

        $response = $this->get(route('public.home', ['locale' => 'en']));

        $response->assertOk();
        $response->assertSee($approved->title);
        $response->assertDontSee($pending->title);
    }
}
