<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class PostgresTextArray implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        $trimmed = trim($value, '{}');
        if ($trimmed === '') {
            return [];
        }

        return str_getcsv($trimmed);
    }

    public function set($model, string $key, $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (!is_array($value)) {
            return $value;
        }

        $escaped = array_map(function ($item) {
            $item = (string) $item;
            if (str_contains($item, ',') || str_contains($item, '"')) {
                $item = '"' . str_replace('"', '\\"', $item) . '"';
            }
            return $item;
        }, $value);

        return '{' . implode(',', $escaped) . '}';
    }
}
