<?php

namespace App\Services\AI;

use App\Services\CategorySlugNormalizer;
use GuzzleHttp\Client;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Psr\Log\LoggerInterface;

class OpenAiClient implements AiClientInterface
{
    public function __construct(
        private readonly Client $client,
        private readonly LoggerInterface $logger,
        private readonly CategorySlugNormalizer $normalizer,
    ) {
    }

    public function generateVideoSeo(array $input): ?array
    {
        $model = config('candidboys.ai.model');
        $baseUrl = rtrim(config('candidboys.ai.openai_base_url'), '/');
        $timeout = config('candidboys.ai.timeout_seconds', 60);
        $retries = config('candidboys.ai.retries', 2);
        $backoff = config('candidboys.ai.backoff_seconds', [2, 5]);
        $temperature = (float) config('candidboys.ai.temperature', 0.3);
        $apiKey = config('candidboys.ai.openai_api_key');

        if (!$apiKey) {
            throw new \RuntimeException('OPENAI_API_KEY is not set');
        }

        $prompt = $this->buildPrompt($input);

        for ($attempt = 0; $attempt <= $retries; $attempt++) {
            try {
                $response = $this->client->post("{$baseUrl}/chat/completions", [
                    'timeout' => $timeout,
                    'headers' => [
                        'Authorization' => 'Bearer '.$apiKey,
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'model' => $model,
                        'temperature' => $temperature,
                        'messages' => [
                            ['role' => 'user', 'content' => $prompt],
                        ],
                    ],
                ]);

                $payload = json_decode((string) $response->getBody(), true);
                $content = data_get($payload, 'choices.0.message.content');
                if (!is_string($content)) {
                    throw new \RuntimeException('Missing response content');
                }

                $json = $this->extractJson($content);
                if (!$json) {
                    throw new \RuntimeException('Invalid JSON payload');
                }

                return $this->validatePayload($json);
            } catch (\Throwable $exception) {
                $this->logger->warning('OpenAI failure', [
                    'provider' => 'openai',
                    'model' => $model,
                    'error' => $exception->getMessage(),
                ]);

                if ($this->isRateLimit($exception)) {
                    sleep($backoff[$attempt] ?? Arr::last($backoff) ?? 1);
                }

                if ($attempt < $retries) {
                    sleep($backoff[$attempt] ?? Arr::last($backoff) ?? 1);
                }
            }
        }

        throw new \RuntimeException('OpenAI failed after retries');
    }

    private function buildPrompt(array $input): string
    {
        $categories = config('candidboys.categories_controlled', []);
        $categoriesList = implode(', ', $categories);

        return <<<PROMPT
OUTPUT JSON ONLY.

Input:
- raw_title: {$input['raw_title']}
- raw_description: {$input['raw_description']}
- raw_tags: {$input['raw_tags']}
- duration_seconds: {$input['duration_seconds']}
- source_name: {$input['source_name']}

Return ONLY this JSON structure:
{
  "seo_title": "...",
  "seo_description": "...",
  "seo_tags": ["..."],
  "category_slug": "...",
  "quality_score": 0-100
}

Rules:
- seo_title length 45-70 chars
- seo_description length 140-300 chars, no repeated templates
- seo_tags 8-16, lowercase, no duplicates
- category_slug must be one of: {$categoriesList}. If no match, use "real-amateur"
- quality_score 0-100
PROMPT;
    }

    private function extractJson(string $content): ?array
    {
        $start = strpos($content, '{');
        $end = strrpos($content, '}');

        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        $jsonString = substr($content, $start, $end - $start + 1);
        $decoded = json_decode($jsonString, true);

        return is_array($decoded) ? $decoded : null;
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

    private function isRateLimit(\Throwable $exception): bool
    {
        $message = $exception->getMessage();
        return str_contains($message, '429') || str_contains($message, 'rate limit');
    }
}
