<?php
declare(strict_types=1);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}

if (!function_exists('__')) {
    function __(string $text, ?string $domain = null): string
    {
        return $text;
    }
}

if (!function_exists('maybe_unserialize')) {
    function maybe_unserialize($data)
    {
        if (!is_string($data)) {
            return $data;
        }
        $trim = trim($data);
        if ($trim === '') {
            return $data;
        }
        $value = @unserialize($trim);
        return $value === false && $trim !== 'b:0;' ? $data : $value;
    }
}

if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field(string $text): string
    {
        return trim(strip_tags($text));
    }
}

if (!function_exists('sanitize_textarea_field')) {
    function sanitize_textarea_field(string $text): string
    {
        return trim(strip_tags($text));
    }
}

require_once __DIR__ . '/../includes/Domain/TaxIdNormalizer.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorES.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorEU.php';
require_once __DIR__ . '/../includes/Admin/SettingsPage.php';
require_once __DIR__ . '/../includes/Checkout/DataExtractor.php';
