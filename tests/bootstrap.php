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
$GLOBALS['tg_test_options'] = $GLOBALS['tg_test_options'] ?? [];
$GLOBALS['tg_actions'] = $GLOBALS['tg_actions'] ?? [];
$GLOBALS['tg_filters'] = $GLOBALS['tg_filters'] ?? [];
$GLOBALS['wc_notices'] = $GLOBALS['wc_notices'] ?? [];
$GLOBALS['wc_stub'] = $GLOBALS['wc_stub'] ?? (object) ['customer' => null, 'cart' => null, 'session' => null];

if (!class_exists('WC_Order')) {
    class WC_Order {
        public function get_id() { return 1; }
        public function update_meta_data($k, $v): void {}
        public function get_user_id() { return 0; }
    }
}

if (!class_exists('WC_REST_Exception')) {
    class WC_REST_Exception extends Exception {
        private array $data = [];
        public function set_data($data): void { $this->data = (array) $data; }
        public function get_error_data(): array { return $this->data; }
    }
}

if (!function_exists('__')) { function __(string $text, ?string $domain = null): string { return $text; } }
if (!function_exists('esc_html__')) { function esc_html__(string $text, ?string $domain = null): string { return $text; } }
if (!function_exists('maybe_unserialize')) {
    function maybe_unserialize($data) {
        if (!is_string($data)) return $data;
        $trim = trim($data);
        if ($trim === '') return $data;
        $value = @unserialize($trim);
        return $value === false && $trim !== 'b:0;' ? $data : $value;
    }
}
if (!function_exists('sanitize_text_field')) { function sanitize_text_field(string $text): string { return trim(strip_tags($text)); } }
if (!function_exists('sanitize_textarea_field')) { function sanitize_textarea_field(string $text): string { return trim(strip_tags($text)); } }
if (!function_exists('wp_unslash')) { function wp_unslash($value) { return $value; } }
if (!function_exists('current_time')) { function current_time($type) { return time(); } }

if (!function_exists('get_option')) { function get_option(string $key, $default = false) { return $GLOBALS['tg_test_options'][$key] ?? $default; } }
if (!function_exists('update_option')) { function update_option(string $key, $value): bool { $GLOBALS['tg_test_options'][$key] = $value; return true; } }
if (!function_exists('set_transient')) { function set_transient(string $key, $value, int $expiration = 0): bool { $GLOBALS['tg_test_transients'][$key] = $value; return true; } }
if (!function_exists('get_transient')) { function get_transient(string $key) { return $GLOBALS['tg_test_transients'][$key] ?? false; } }
if (!function_exists('delete_transient')) { function delete_transient(string $key): bool { unset($GLOBALS['tg_test_transients'][$key]); return true; } }

if (!function_exists('add_action')) {
    function add_action(string $hook, callable $callback, int $priority = 10, int $accepted_args = 1): bool {
        $GLOBALS['tg_actions'][$hook][$priority][] = [$callback, $accepted_args];
        return true;
    }
}
if (!function_exists('do_action')) {
    function do_action(string $hook, ...$args): void {
        if (empty($GLOBALS['tg_actions'][$hook])) return;
        ksort($GLOBALS['tg_actions'][$hook]);
        foreach ($GLOBALS['tg_actions'][$hook] as $callbacks) {
            foreach ($callbacks as [$cb, $accepted]) {
                call_user_func_array($cb, array_slice($args, 0, $accepted));
            }
        }
    }
}
if (!function_exists('add_filter')) {
    function add_filter(string $hook, callable $callback, int $priority = 10, int $accepted_args = 1): bool {
        $GLOBALS['tg_filters'][$hook][$priority][] = [$callback, $accepted_args];
        return true;
    }
}
if (!function_exists('apply_filters')) {
    function apply_filters(string $hook, $value, ...$args) {
        if (empty($GLOBALS['tg_filters'][$hook])) return $value;
        ksort($GLOBALS['tg_filters'][$hook]);
        $v = $value;
        foreach ($GLOBALS['tg_filters'][$hook] as $callbacks) {
            foreach ($callbacks as [$cb, $accepted]) {
                $v = call_user_func_array($cb, array_slice(array_merge([$v], $args), 0, $accepted));
            }
        }
        return $v;
    }
}

if (!function_exists('wc_add_notice')) {
    function wc_add_notice(string $message, string $type = 'success'): void { $GLOBALS['wc_notices'][] = ['message'=>$message,'type'=>$type]; }
}
if (!function_exists('WC')) { function WC() { return $GLOBALS['wc_stub']; } }
if (!function_exists('is_user_logged_in')) { function is_user_logged_in(): bool { return false; } }
if (!function_exists('update_user_meta')) { function update_user_meta($a,$b,$c=''){ return true; } }
if (!function_exists('delete_user_meta')) { function delete_user_meta($a,$b){ return true; } }

if (!class_exists('TaxID_Guard\\Bootstrap')) {
    class_alias('TaxID_Guard_Test_Bootstrap', 'TaxID_Guard\\Bootstrap');
    class TaxID_Guard_Test_Bootstrap { public static function get_logger(){ return null; } public static function instance(){ return new self(); } public function debug_checkout_context(): string { return 'test'; } }
}

require_once __DIR__ . '/../includes/ValueObjects/TaxIdInput.php';
require_once __DIR__ . '/../includes/ValueObjects/ValidationResult.php';
require_once __DIR__ . '/../includes/Domain/TaxIdNormalizer.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorES.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorEU.php';
require_once __DIR__ . '/../includes/Checkout/DataExtractor.php';
require_once __DIR__ . '/../includes/Checkout/Validator.php';
require_once __DIR__ . '/../includes/Pro/Vies/ViesClient.php';
require_once __DIR__ . '/../includes/Pro/Vies/ViesService.php';
require_once __DIR__ . '/../includes/Admin/SettingsPage.php';
