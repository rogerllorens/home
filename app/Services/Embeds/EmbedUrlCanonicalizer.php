<?php

namespace App\Services\Embeds;

use Illuminate\Support\Str;

class EmbedUrlCanonicalizer
{
    public function canonicalize(string $url, bool $allowHttp = false): ?string
    {
        $trimmed = trim($url);
        if ($trimmed === '') {
            return null;
        }

        $parts = parse_url($trimmed);
        if (!$parts || empty($parts['host']) || empty($parts['scheme'])) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);
        if (!in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        if ($scheme === 'http' && !$allowHttp) {
            return null;
        }

        $host = strtolower($parts['host']);
        $path = $parts['path'] ?? '';
        $query = $parts['query'] ?? '';

        parse_str($query, $queryParams);
        foreach ($queryParams as $key => $value) {
            if (Str::startsWith($key, 'utm_')) {
                unset($queryParams[$key]);
            }
        }

        $normalizedQuery = http_build_query($queryParams);
        $canonical = $scheme.'://'.$host.$path;
        if ($normalizedQuery !== '') {
            $canonical .= '?'.$normalizedQuery;
        }

        return $canonical;
    }
}
