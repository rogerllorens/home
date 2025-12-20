<?php

namespace App\Services\Import;

use App\DTO\VideoCandidate;
use App\Models\Source;
use GuzzleHttp\Client;

class FeedJsonAdapter implements SourceAdapterInterface
{
    public function __construct(private readonly Client $client)
    {
    }

    public function fetchCandidates(Source $source): array
    {
        $response = $this->client->get($source->feed_url, [
            'headers' => $this->buildHeaders($source),
            'timeout' => 10,
        ]);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $itemsPath = $source->settings['items_path'] ?? null;
        $items = $itemsPath ? data_get($payload, $itemsPath) : $payload;

        if (!is_array($items)) {
            return [];
        }

        $items = array_slice($items, 0, 500);

        return array_values(array_filter(array_map(function ($item) use ($source) {
            if (!is_array($item)) {
                return null;
            }

            $mapping = $source->settings['mappings'] ?? [];

            return new VideoCandidate(
                externalId: (string) data_get($item, $mapping['external_id'] ?? 'id'),
                embedUrl: (string) data_get($item, $mapping['embed_url'] ?? 'embed_url'),
                thumbnailUrl: (string) data_get($item, $mapping['thumbnail_url'] ?? 'thumbnail_url'),
                rawTitle: (string) data_get($item, $mapping['raw_title'] ?? 'title'),
                rawDescription: data_get($item, $mapping['raw_description'] ?? 'description'),
                rawTags: data_get($item, $mapping['raw_tags'] ?? 'tags'),
                durationSeconds: data_get($item, $mapping['duration_seconds'] ?? 'duration_seconds'),
                sourceUrl: data_get($item, $mapping['source_url'] ?? 'source_url'),
            );
        }, $items)));
    }

    private function buildHeaders(Source $source): array
    {
        $headers = [
            'Accept' => 'application/json',
        ];

        if (!empty($source->auth_header)) {
            $headers['Authorization'] = $source->auth_header;
        }

        return $headers;
    }
}
