<?php

namespace App\Services\AI;

use GuzzleHttp\Client;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Psr\Log\LoggerInterface;

class OllamaClient
{
    public function __construct(
        private readonly Client $client,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function generateSeoPayload(array $input, int $videoId): ?array
    {
        $host = rtrim(config('candidboys.ai.ollama_host'), '/');
        $model = config('candidboys.ai.ollama_model');
        $timeout = config('candidboys.ai.timeout_seconds', 60);
        $retries = config('candidboys.ai.retries', 2);
        $backoff = config('candidboys.ai.backoff_seconds', [2, 5]);

        $prompt = $this->buildPrompt($input);

        for ($attempt = 0; $attempt <= $retries; $attempt++) {
            try {
                $response = $this->client->post("{$host}/api/chat", [
                    'timeout' => $timeout,
                    'json' => [
                        'model' => $model,
                        'messages' => [
                            [
                                'role' => 'user',
                                'content' => $prompt,
                            ],
                        ],
                        'stream' => false,
                    ],
                ]);

                $payload = json_decode((string) $response->getBody(), true);
                $content = data_get($payload, 'message.content');
                if (!is_string($content)) {
                    throw new \RuntimeException('Respuesta sin contenido.');
                }

                $json = $this->extractJson($content);
                if ($json === null) {
                    throw new \RuntimeException('No se encontró JSON válido en la respuesta.');
                }

                return $json;
            } catch (\Throwable $exception) {
                $this->logger->warning('Ollama failure', [
                    'video_id' => $videoId,
                    'attempt' => $attempt,
                    'error' => $exception->getMessage(),
                ]);

                if ($attempt < $retries) {
                    sleep($backoff[$attempt] ?? Arr::last($backoff) ?? 1);
                }
            }
        }

        return null;
    }

    private function buildPrompt(array $input): string
    {
        $categories = config('candidboys.categories_controlled', []);
        $categoriesList = implode(', ', $categories);

        return <<<PROMPT
Genera SEO para un video. Responde SOLO JSON válido.

Entrada:
- raw_title: {$input['raw_title']}
- raw_description: {$input['raw_description']}
- raw_tags: {$input['raw_tags']}
- duration: {$input['duration']}
- source_name: {$input['source_name']}
- category_hint: {$input['category_hint']}

Salida JSON EXACTA:
{
  "seo_title": "...",
  "seo_description": "...",
  "seo_tags": ["..."],
  "category_slug": "...",
  "quality_score": 0-100
}

Reglas:
- seo_title 45-70 caracteres.
- seo_description 140-300 caracteres, sin plantillas repetidas ni spam.
- seo_tags: 8-16 tags, minúsculas, sin duplicados.
- category_slug SOLO de esta lista: {$categoriesList}. Si no encaja, usa "real-amateur".
- quality_score en función de completitud y diversidad.
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

        if (!is_array($decoded)) {
            return null;
        }

        return $decoded;
    }
}
