<?php

namespace App\Services\Import;

use App\DTO\VideoCandidate;
use App\Models\Source;
use DOMDocument;
use DOMXPath;
use GuzzleHttp\Client;

class FeedXmlAdapter implements SourceAdapterInterface
{
    public function __construct(private readonly Client $client)
    {
    }

    public function fetchCandidates(Source $source): array
    {
        try {
            $response = $this->client->get($source->feed_url, [
                'headers' => $this->buildHeaders($source),
                'timeout' => 10,
            ]);
        } catch (\Throwable $exception) {
            throw new \RuntimeException('Feed XML no disponible: '.$exception->getMessage(), 0, $exception);
        }

        $xml = (string) $response->getBody();
        $document = new DOMDocument();
        $document->resolveExternals = false;
        $document->substituteEntities = false;
        $loaded = $document->loadXML($xml, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        if (!$loaded) {
            throw new \RuntimeException('Feed XML inválido: no se pudo parsear.');
        }

        $xpath = new DOMXPath($document);
        $itemsPath = $source->settings['items_path'] ?? null;
        $nodes = $itemsPath ? $xpath->query($itemsPath) : $document->getElementsByTagName('item');

        if ($nodes === false) {
            throw new \RuntimeException("items_path inválido o no encontrado: {$itemsPath}");
        }

        $mapping = $source->settings['mappings'] ?? [];
        $candidates = [];

        foreach ($nodes as $node) {
            $candidate = new VideoCandidate(
                externalId: $this->readNode($xpath, $node, $mapping['external_id'] ?? 'id'),
                embedUrl: $this->readNode($xpath, $node, $mapping['embed_url'] ?? 'embed_url'),
                thumbnailUrl: $this->readNode($xpath, $node, $mapping['thumbnail_url'] ?? 'thumbnail_url'),
                rawTitle: $this->readNode($xpath, $node, $mapping['raw_title'] ?? 'title'),
                rawDescription: $this->nullableNode($xpath, $node, $mapping['raw_description'] ?? 'description'),
                rawTags: $this->splitTags($this->nullableNode($xpath, $node, $mapping['raw_tags'] ?? 'tags')),
                durationSeconds: $this->nullableInt($this->nullableNode($xpath, $node, $mapping['duration_seconds'] ?? 'duration_seconds')),
                sourceUrl: $this->nullableNode($xpath, $node, $mapping['source_url'] ?? 'source_url'),
            );

            $candidates[] = $candidate;

            if (count($candidates) >= 500) {
                break;
            }
        }

        return $candidates;
    }

    private function buildHeaders(Source $source): array
    {
        $headers = [
            'Accept' => 'application/xml,text/xml',
        ];

        if (!empty($source->auth_header)) {
            $headers['Authorization'] = $source->auth_header;
        }

        return $headers;
    }

    private function readNode(DOMXPath $xpath, $context, string $path): string
    {
        $value = $this->nullableNode($xpath, $context, $path);
        return $value ?? '';
    }

    private function nullableNode(DOMXPath $xpath, $context, string $path): ?string
    {
        $nodes = $xpath->query($path, $context);
        if ($nodes && $nodes->length > 0) {
            return trim($nodes->item(0)->textContent);
        }

        return null;
    }

    private function splitTags(?string $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        return array_values(array_filter(array_map('trim', preg_split('/[,|]/', $value))));
    }

    private function nullableInt(?string $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}
