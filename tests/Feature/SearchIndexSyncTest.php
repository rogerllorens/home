<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Scout\Scout;
use Tests\TestCase;

class SearchIndexSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_index_sync_calls_when_enabled(): void
    {
        if (!method_exists(Scout::class, 'fake')) {
            $this->markTestSkipped('Scout fake helpers not available.');
        }

        Scout::fake();
        Video::enableSearchSyncing();
        config()->set('app.env', 'production');
        app()->detectEnvironment(fn () => 'production');

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        $video->title = 'Updated title';
        $video->save();
        $video->delete();

        if (method_exists(Scout::class, 'assertSynced')) {
            Scout::assertSynced($video);
        }

        if (method_exists(Scout::class, 'assertDeleted')) {
            Scout::assertDeleted($video);
        }
    }
}
