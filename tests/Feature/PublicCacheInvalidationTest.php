<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\User;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cache_version_increments_after_publish(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Ready,
        ]);

        $versionBefore = PublicCache::version();

        $this->actingAs($admin)->post(route('admin.videos.publish', $video));

        $this->assertSame($versionBefore + 1, PublicCache::version());
    }
}
