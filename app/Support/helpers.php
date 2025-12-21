<?php

use Illuminate\Support\Carbon;

if (!function_exists('format_views')) {
    function format_views(int $views): string
    {
        if ($views < 1000) {
            return number_format($views);
        }

        $units = [
            'B' => 1_000_000_000,
            'M' => 1_000_000,
            'K' => 1_000,
        ];

        foreach ($units as $suffix => $size) {
            if ($views >= $size) {
                $value = $views / $size;
                $formatted = $value >= 10 ? number_format($value, 0) : number_format($value, 1);

                return rtrim(rtrim($formatted, '0'), '.') . $suffix;
            }
        }

        return number_format($views);
    }
}

if (!function_exists('time_ago')) {
    function time_ago($date): string
    {
        return Carbon::parse($date)->diffForHumans();
    }
}
