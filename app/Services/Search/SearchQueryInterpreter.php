<?php

namespace App\Services\Search;

use Illuminate\Support\Str;

class SearchQueryInterpreter
{
    public function interpret(string $query, string $locale): array
    {
        $normalized = $this->normalize($query);
        $tokens = $this->tokens($normalized);
        $stopwords = config('search.stopwords.'.$locale, []);

        $filtered = collect($tokens)
            ->reject(fn (string $token) => in_array($token, $stopwords, true))
            ->values();

        $mapped = $this->mapSynonyms($filtered, $locale);
        $filters = $this->detectIntent($tokens);
        $tagHints = $this->mapAliases($tokens, 'tag_aliases');
        $categoryHints = $this->mapAliases($tokens, 'category_aliases');

        $queryString = collect($mapped)
            ->merge($tagHints)
            ->merge($categoryHints)
            ->filter()
            ->unique()
            ->implode(' ');

        return [
            'normalized' => $normalized,
            'tokens' => $tokens,
            'query' => $queryString,
            'filters' => $filters,
            'tag_hints' => $tagHints,
            'category_hints' => $categoryHints,
        ];
    }

    private function normalize(string $query): string
    {
        $normalized = Str::lower(trim($query));
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        $normalized = Str::ascii($normalized);

        return trim((string) $normalized);
    }

    private function tokens(string $normalized): array
    {
        if ($normalized === '') {
            return [];
        }

        $parts = preg_split('/[^a-z0-9-]+/i', $normalized);

        return array_values(array_filter($parts));
    }

    private function mapSynonyms(\Illuminate\Support\Collection $tokens, string $locale): array
    {
        $synonyms = config('search.synonyms.'.$locale, []);
        if (empty($synonyms)) {
            return $tokens->all();
        }

        return $tokens
            ->map(function (string $token) use ($synonyms) {
                foreach ($synonyms as $canonical => $variants) {
                    if ($token === $canonical || in_array($token, $variants, true)) {
                        return $canonical;
                    }
                }

                return $token;
            })
            ->all();
    }

    private function detectIntent(array $tokens): array
    {
        $filters = [];
        $config = config('search.intent_keywords', []);

        foreach ($config['duration'] ?? [] as $duration => $keywords) {
            if ($this->containsAny($tokens, $keywords)) {
                $filters['duration'] = $duration;
                break;
            }
        }

        foreach ($config['sort'] ?? [] as $sort => $keywords) {
            if ($this->containsAny($tokens, $keywords)) {
                $filters['sort'] = $sort;
                break;
            }
        }

        foreach ($config['date'] ?? [] as $date => $keywords) {
            if ($this->containsAny($tokens, $keywords)) {
                $filters['date'] = $date;
                break;
            }
        }

        return $filters;
    }

    private function mapAliases(array $tokens, string $key): array
    {
        $aliases = config('search.'.$key, []);
        if (empty($aliases)) {
            return [];
        }

        $mapped = [];
        foreach ($aliases as $canonical => $variants) {
            if ($this->containsAny($tokens, array_merge([$canonical], $variants))) {
                $mapped[] = $canonical;
            }
        }

        return $mapped;
    }

    private function containsAny(array $tokens, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            $normalized = Str::ascii(Str::lower($keyword));
            if (in_array($normalized, $tokens, true)) {
                return true;
            }
        }

        return false;
    }
}
