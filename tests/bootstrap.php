<?php
declare(strict_types=1);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}


if (!defined('MINUTE_IN_SECONDS')) {
    define('MINUTE_IN_SECONDS', 60);
}
if (!defined('HOUR_IN_SECONDS')) {
    define('HOUR_IN_SECONDS', 3600);
}

$GLOBALS['tg_test_transients'] = $GLOBALS['tg_test_transients'] ?? [];

if (!function_exists('get_transient')) {
    function get_transient(string $key)
    {
        return $GLOBALS['tg_test_transients'][$key] ?? false;
    }
}

if (!function_exists('set_transient')) {
    function set_transient(string $key, $value, int $expiration = 0): bool
    {
        $GLOBALS['tg_test_transients'][$key] = $value;
        return true;
    }
}

if (!function_exists('delete_transient')) {
    function delete_transient(string $key): bool
    {
        unset($GLOBALS['tg_test_transients'][$key]);
        return true;
    }
}

$GLOBALS['tg_test_options'] = $GLOBALS['tg_test_options'] ?? [];

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

if (!function_exists('get_option')) {
    function get_option(string $key, $default = false)
    {
        return $GLOBALS['tg_test_options'][$key] ?? $default;
    }
}

if (!function_exists('update_option')) {
    function update_option(string $key, $value): bool
    {
        $GLOBALS['tg_test_options'][$key] = $value;
        return true;
    }
}

if (!function_exists('add_action')) {
    function add_action(...$args): bool
    {
        return true;
    }
}

if (!function_exists('add_filter')) {
    function add_filter(...$args): bool
    {
        return true;
    }
}

if (!function_exists('is_user_logged_in')) {
    function is_user_logged_in(): bool
    {
        return false;
    }
}

require_once __DIR__ . '/../includes/Domain/TaxIdNormalizer.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorES.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorEU.php';
require_once __DIR__ . '/../includes/Admin/SettingsPage.php';
require_once __DIR__ . '/../includes/Checkout/DataExtractor.php';

require_once __DIR__ . '/../includes/Pro/Vies/ViesClient.php';
require_once __DIR__ . '/../includes/Pro/Vies/ViesService.php';
