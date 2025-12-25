<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminVideoCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_publish_and_unpublish_video(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'published_at' => null,
        ]);

        $publish = $this->actingAs($admin)->post(route('admin.videos.publish', $video));
        $publish->assertSessionHas('status');

        $video->refresh();
        $this->assertSame(VideoStatus::Published, $video->status);
        $this->assertNotNull($video->published_at);

        $unpublish = $this->actingAs($admin)->post(route('admin.videos.unpublish', $video));
        $unpublish->assertSessionHas('status');

        $video->refresh();
        $this->assertSame(VideoStatus::Ready, $video->status);
    }
}
