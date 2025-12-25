<?php

namespace App\Services\Embeds;

class EmbedDomainMatcher
{
    public function normalizeHost(string $value): ?string
    {
        $value = trim(strtolower($value));
        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            $host = parse_url($value, PHP_URL_HOST);
            return $host ? strtolower($host) : null;
        }

        $value = preg_replace('/:\d+$/', '', $value);
        $value = preg_replace('/[^a-z0-9.*-]/', '', $value);
        if (str_starts_with($value, '*.')) {
            $suffix = ltrim(substr($value, 2), '.');
            if ($suffix === '' || str_contains($suffix, '..')) {
                return null;
            }
            return '*.' . $suffix;
        }

        $value = ltrim($value, '.');

        if ($value === '' || $value === '*' || str_contains($value, '..')) {
            return null;
        }

        return $value;
    }

    public function isAllowed(string $host, array $allowlist): bool
    {
        if (empty($allowlist)) {
            return true;
        }

        $normalizedHost = $this->normalizeHost($host);
        if (!$normalizedHost) {
            return false;
        }

        foreach ($allowlist as $entry) {
            $normalizedEntry = $this->normalizeHost((string) $entry);
            if (!$normalizedEntry) {
                continue;
            }

            if (str_starts_with($normalizedEntry, '*.')) {
                $suffix = substr($normalizedEntry, 2);
                if ($suffix && (str_ends_with($normalizedHost, '.'.$suffix) || $normalizedHost === $suffix)) {
                    return true;
                }
            } elseif ($normalizedHost === $normalizedEntry) {
                return true;
            }
        }

        return false;
    }
}
