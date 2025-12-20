<?php

namespace App\Jobs;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\AI\OllamaClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class GenerateVideoSeoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $videoId)
    {
    }

    public function handle(OllamaClient $client): void
    {
        $video = Video::with('source')->find($this->videoId);
        if (!$video) {
            return;
        }

        $payload = $client->generateSeoPayload([
            'raw_title' => $video->raw_title ?? $video->title,
            'raw_description' => $video->raw_description ?? $video->description,
            'raw_tags' => implode(', ', $video->raw_tags ?? []),
            'duration' => $video->duration_seconds ? $video->duration_seconds.'s' : 'n/a',
            'source_name' => $video->source?->name ?? 'unknown',
            'category_hint' => $video->category_slug ?? 'n/a',
        ], $video->id);

        if (!$payload) {
            $video->update([
                'status' => VideoStatus::Quarantine,
            ]);
            return;
        }

        $validated = $this->validatePayload($payload);
        if (!$validated) {
            $video->update([
                'status' => VideoStatus::Quarantine,
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

    private function validatePayload(array $payload): ?array
    {
        $title = trim((string) ($payload['seo_title'] ?? ''));
        $description = trim((string) ($payload['seo_description'] ?? ''));
        $tags = $payload['seo_tags'] ?? [];
        $category = (string) ($payload['category_slug'] ?? '');
        $quality = (int) ($payload['quality_score'] ?? 0);

        if ($title === '' || $description === '') {
            return null;
        }

        $titleLength = Str::length($title);
        if ($titleLength < config('candidboys.seo.title_min') || $titleLength > config('candidboys.seo.title_max')) {
            return null;
        }

        $descLength = Str::length($description);
        if ($descLength < config('candidboys.seo.desc_min') || $descLength > config('candidboys.seo.desc_max')) {
            return null;
        }

        $tags = array_values(array_unique(array_map('strtolower', Arr::wrap($tags))));
        $tags = array_values(array_filter($tags));

        $minTags = config('candidboys.seo.tags_min');
        $maxTags = config('candidboys.seo.tags_max');
        if (count($tags) < $minTags || count($tags) > $maxTags) {
            return null;
        }

        $categories = config('candidboys.categories_controlled', []);
        if (!in_array($category, $categories, true)) {
            $category = 'real-amateur';
        }

        if ($quality < 0 || $quality > 100) {
            return null;
        }

        return [
            'seo_title' => $title,
            'seo_description' => $description,
            'seo_tags' => $tags,
            'category_slug' => $category,
            'quality_score' => $quality,
        ];
    }
}
