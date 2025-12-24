<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Jobs\GenerateVideoSeoJob;
use App\Models\Video;
use App\Services\AI\AiClientFactory;
use App\Services\AI\AiClientInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GenerateVideoSeoJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_marks_quarantine_on_ai_failure(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Draft,
        ]);

        $client = Mockery::mock(AiClientInterface::class);
        $client->shouldReceive('generateVideoSeo')->andThrow(new \RuntimeException('fail'));

        $factory = Mockery::mock(AiClientFactory::class);
        $factory->shouldReceive('make')->andReturn($client);

        $this->app->instance(AiClientFactory::class, $factory);

        (new GenerateVideoSeoJob($video->id))->handle($factory);

        $video->refresh();
        $this->assertSame(VideoStatus::Quarantine, $video->status);
    }
}
