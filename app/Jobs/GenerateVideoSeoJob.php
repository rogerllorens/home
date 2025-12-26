<?php

namespace App\Jobs;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\AI\AiClientFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateVideoSeoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;
    public array $backoff = [60, 120, 300];

    public function __construct(public int $videoId)
    {
    }

    public function retryUntil(): \DateTimeInterface
    {
        return now()->addMinutes(10);
    }

    public function handle(AiClientFactory $factory): void
    {
        $video = Video::with('source')->find($this->videoId);
        if (!$video) {
            return;
        }

        $input = [
            'raw_title' => $video->raw_title ?? $video->title,
            'raw_description' => $video->raw_description ?? $video->description,
            'raw_tags' => implode(', ', $video->raw_tags ?? []),
            'duration' => $video->duration_seconds ? $video->duration_seconds.'s' : 'n/a',
            'duration_seconds' => $video->duration_seconds ?? 0,
            'source_name' => $video->source?->name ?? 'unknown',
            'category_hint' => $video->category_slug ?? 'n/a',
            'video_id' => $video->id,
        ];

        try {
            $validated = $factory->make()->generateVideoSeo($input);
        } catch (\Throwable $exception) {
            Log::warning('AI SEO generation failed', [
                'video_id' => $video->id,
                'error' => $exception->getMessage(),
            ]);
            $video->update([
                'status' => VideoStatus::Quarantine,
            ]);
            return;
        }

        if (!$validated) {
            Log::info('AI SEO generation skipped', [
                'video_id' => $video->id,
            ]);
            return;
        }

        $video->fill([
            'seo_title' => $video->seo_title ?: $validated['seo_title'],
            'seo_description' => $video->seo_description ?: $validated['seo_description'],
            'seo_tags' => empty($video->seo_tags) ? $validated['seo_tags'] : $video->seo_tags,
            'category_slug' => $validated['category_slug'] ?? $video->category_slug,
            'ai_quality' => $validated['quality_score'],
            'ai_checked_at' => now(),
            'status' => VideoStatus::AiDone,
        ]);

        $video->save();
    }
}
