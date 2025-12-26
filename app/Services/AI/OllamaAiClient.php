<?php

namespace App\Services\AI;

use App\Services\CategorySlugNormalizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Psr\Log\LoggerInterface;

class OllamaAiClient implements AiClientInterface
{
    public function __construct(
        private readonly OllamaClient $client,
        private readonly CategorySlugNormalizer $normalizer,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function generateVideoSeo(array $input): ?array
    {
        $payload = $this->client->generateSeoPayload($input, (int) ($input['video_id'] ?? 0));
        if (!$payload) {
            throw new \RuntimeException('Ollama failed to return payload');
        }

        try {
            return $this->validatePayload($payload);
        } catch (\Throwable $exception) {
            $this->logger->warning('Ollama payload invalid', [
                'error' => $exception->getMessage(),
            ]);
            throw $exception;
        }
    }

    private function validatePayload(array $payload): array
    {
        $title = trim((string) ($payload['seo_title'] ?? ''));
        $description = trim((string) ($payload['seo_description'] ?? ''));
        $tags = $payload['seo_tags'] ?? [];
        $category = $this->normalizer->normalize((string) ($payload['category_slug'] ?? ''));
        $quality = (int) ($payload['quality_score'] ?? 0);

        if ($title === '' || $description === '') {
            throw new \RuntimeException('Missing seo_title or seo_description');
        }

        $titleLength = Str::length($title);
        if ($titleLength < config('candidboys.seo.title_min') || $titleLength > config('candidboys.seo.title_max')) {
            throw new \RuntimeException('seo_title length invalid');
        }

        $descLength = Str::length($description);
        if ($descLength < config('candidboys.seo.desc_min') || $descLength > config('candidboys.seo.desc_max')) {
            throw new \RuntimeException('seo_description length invalid');
        }

        $tags = array_values(array_unique(array_map('strtolower', Arr::wrap($tags))));
        $tags = array_values(array_filter($tags));
        $minTags = config('candidboys.seo.tags_min');
        $maxTags = config('candidboys.seo.tags_max');
        if (count($tags) < $minTags || count($tags) > $maxTags) {
            throw new \RuntimeException('seo_tags count invalid');
        }

        if ($quality < 0 || $quality > 100) {
            throw new \RuntimeException('quality_score invalid');
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
