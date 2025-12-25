<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Jobs\CheckVideoEmbedJob;
use App\Models\Video;
use App\Services\Embeds\EmbedChecker;
use App\Services\Embeds\EmbedDomainMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Mockery;
use Tests\TestCase;

class CheckVideoEmbedJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_embed_job_marks_broken_after_failures(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'embed_url' => 'https://player.example.com/embed/1',
            'embed_ok' => true,
        ]);

        $video->source()->update([
            'settings' => [
                'allow_iframe_domains' => ['player.example.com'],
            ],
        ]);

        $checker = Mockery::mock(EmbedChecker::class);
        $checker->shouldReceive('check')->andReturn(false);

        Redis::shouldReceive('incr')->andReturn(3);
        Redis::shouldReceive('expire')->andReturn(true);

        (new CheckVideoEmbedJob($video->id))->handle($checker, new EmbedDomainMatcher());

        $video->refresh();
        $this->assertSame(VideoStatus::Broken, $video->status);
        $this->assertSame('embed_unreachable', $video->quarantine_reason);
    }

    public function test_embed_job_marks_ok_and_clears_failures(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'embed_url' => 'https://player.example.com/embed/2',
            'embed_ok' => false,
        ]);

        $video->source()->update([
            'settings' => [
                'allow_iframe_domains' => ['player.example.com'],
            ],
        ]);

        $checker = Mockery::mock(EmbedChecker::class);
        $checker->shouldReceive('check')->andReturn(true);

        Redis::shouldReceive('del')->once()->andReturn(true);

        (new CheckVideoEmbedJob($video->id))->handle($checker, new EmbedDomainMatcher());

        $video->refresh();
        $this->assertTrue($video->embed_ok);
        $this->assertNotNull($video->embed_last_ok_at);
    }

    public function test_embed_job_handles_timeout_without_crashing(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'embed_url' => 'https://player.example.com/embed/3',
            'embed_ok' => true,
        ]);

        $video->source()->update([
            'settings' => [
                'allow_iframe_domains' => ['player.example.com'],
            ],
        ]);

        $checker = Mockery::mock(EmbedChecker::class);
        $checker->shouldReceive('check')->andThrow(new \RuntimeException('Timeout'));

        $job = Mockery::mock(CheckVideoEmbedJob::class.'[release]', [$video->id])->makePartial();
        $job->shouldReceive('release')->once();

        $job->handle($checker, new EmbedDomainMatcher());
    }
}
