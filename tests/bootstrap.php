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
if (!defined('WP_UNINSTALL_PLUGIN')) {
    define('WP_UNINSTALL_PLUGIN', true);
}

$GLOBALS['tg_blog_id'] = $GLOBALS['tg_blog_id'] ?? 1;
$GLOBALS['tg_is_multisite'] = $GLOBALS['tg_is_multisite'] ?? false;
$GLOBALS['tg_sites'] = $GLOBALS['tg_sites'] ?? [1];
$GLOBALS['tg_test_options_by_blog'] = $GLOBALS['tg_test_options_by_blog'] ?? [1 => []];
$GLOBALS['tg_test_transients_by_blog'] = $GLOBALS['tg_test_transients_by_blog'] ?? [1 => []];
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
if (!function_exists('sanitize_key')) { function sanitize_key(string $key): string { return strtolower(preg_replace('/[^a-zA-Z0-9_\-]/', '', $key)); } }
if (!function_exists('wp_unslash')) { function wp_unslash($v){ return $v; } }
if (!function_exists('current_time')) { function current_time($type){ return time(); } }

if (!function_exists('get_option')) {
    function get_option(string $key, $default = false) {
        $blog = $GLOBALS['tg_blog_id'];
        return $GLOBALS['tg_test_options_by_blog'][$blog][$key] ?? $default;
    }
}
if (!function_exists('update_option')) {
    function update_option(string $key, $value): bool {
        $blog = $GLOBALS['tg_blog_id'];
        $GLOBALS['tg_test_options_by_blog'][$blog][$key] = $value;
        return true;
    }
}
if (!function_exists('delete_option')) {
    function delete_option(string $key): bool {
        $blog = $GLOBALS['tg_blog_id'];
        unset($GLOBALS['tg_test_options_by_blog'][$blog][$key]);
        return true;
    }
}
if (!function_exists('set_transient')) {
    function set_transient(string $key, $value, int $expiration = 0): bool {
        $blog = $GLOBALS['tg_blog_id'];
        $GLOBALS['tg_test_transients_by_blog'][$blog][$key] = $value;
        $GLOBALS['tg_test_options_by_blog'][$blog]['_transient_' . $key] = $value;
        $GLOBALS['tg_test_options_by_blog'][$blog]['_transient_timeout_' . $key] = time() + $expiration;
        return true;
    }
}
if (!function_exists('get_transient')) {
    function get_transient(string $key) {
        $blog = $GLOBALS['tg_blog_id'];
        return $GLOBALS['tg_test_transients_by_blog'][$blog][$key] ?? false;
    }
}
if (!function_exists('delete_transient')) {
    function delete_transient(string $key): bool {
        $blog = $GLOBALS['tg_blog_id'];
        unset($GLOBALS['tg_test_transients_by_blog'][$blog][$key]);
        unset($GLOBALS['tg_test_options_by_blog'][$blog]['_transient_' . $key]);
        unset($GLOBALS['tg_test_options_by_blog'][$blog]['_transient_timeout_' . $key]);
        return true;
    }
}

if (!function_exists('is_multisite')) { function is_multisite(): bool { return (bool) $GLOBALS['tg_is_multisite']; } }
if (!function_exists('get_sites')) {
    function get_sites(array $args = []): array {
        if (($args['fields'] ?? '') === 'ids') {
            return $GLOBALS['tg_sites'];
        }
        return array_map(static fn($id) => (object) ['blog_id' => $id], $GLOBALS['tg_sites']);
    }
}
if (!function_exists('switch_to_blog')) {
    function switch_to_blog($site_id): bool { $GLOBALS['tg_prev_blog_id'] = $GLOBALS['tg_blog_id']; $GLOBALS['tg_blog_id'] = (int) $site_id; return true; }
}
if (!function_exists('restore_current_blog')) {
    function restore_current_blog(): bool { $GLOBALS['tg_blog_id'] = $GLOBALS['tg_prev_blog_id'] ?? 1; return true; }
}

if (!function_exists('add_action')) {
    function add_action(string $hook, callable $cb, int $priority = 10, int $accepted_args = 1): bool {
        $GLOBALS['tg_actions'][$hook][$priority][] = [$cb, $accepted_args];
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
    function add_filter(string $hook, callable $cb, int $priority = 10, int $accepted_args = 1): bool {
        $GLOBALS['tg_filters'][$hook][$priority][] = [$cb, $accepted_args];
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

if (!function_exists('wc_add_notice')) { function wc_add_notice(string $msg, string $type = 'success'): void { $GLOBALS['wc_notices'][] = ['message' => $msg, 'type' => $type]; } }
if (!function_exists('WC')) { function WC() { return $GLOBALS['wc_stub']; } }
if (!function_exists('is_user_logged_in')) { function is_user_logged_in(): bool { return false; } }
if (!function_exists('current_user_can')) { function current_user_can($cap): bool { return true; } }
if (!function_exists('update_user_meta')) { function update_user_meta($a, $b, $c = ''): bool { return true; } }
if (!function_exists('delete_user_meta')) { function delete_user_meta($a, $b): bool { return true; } }
if (!function_exists('wp_get_current_user')) { function wp_get_current_user() { return (object) ['roles' => ['customer']]; } }

if (!class_exists('wpdb')) {
    class wpdb {
        public string $options = 'wp_options';
        public function esc_like(string $s): string { return $s; }
        public function prepare(string $query, string $like): array { return [$query, $like]; }
        public function query($prepared): int {
            $like = is_array($prepared) ? (string) ($prepared[1] ?? '') : '';
            $prefix = rtrim($like, '%');
            $blog = $GLOBALS['tg_blog_id'];
            $count = 0;
            foreach (array_keys($GLOBALS['tg_test_options_by_blog'][$blog] ?? []) as $key) {
                if (str_starts_with($key, $prefix)) {
                    unset($GLOBALS['tg_test_options_by_blog'][$blog][$key]);
                    $count++;
                }
            }
            return $count;
        }
    }
}
$GLOBALS['wpdb'] = $GLOBALS['wpdb'] ?? new wpdb();

if (!class_exists('TaxID_Guard_Test_Bootstrap')) {
    class TaxID_Guard_Test_Bootstrap { public static function get_logger(){ return null; } public static function instance(){ return new self(); } public function debug_checkout_context(): string { return 'test'; } }
}
if (!class_exists('TaxID_Guard\\Bootstrap')) {
    class_alias('TaxID_Guard_Test_Bootstrap', 'TaxID_Guard\\Bootstrap');
}

require_once __DIR__ . '/../includes/ValueObjects/TaxIdInput.php';
require_once __DIR__ . '/../includes/ValueObjects/ValidationResult.php';
require_once __DIR__ . '/../includes/Domain/TaxIdNormalizer.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorES.php';
require_once __DIR__ . '/../includes/Domain/TaxIdValidatorEU.php';
require_once __DIR__ . '/../includes/Checkout/DataExtractor.php';
require_once __DIR__ . '/../includes/Checkout/ValidatorService.php';
require_once __DIR__ . '/../includes/Checkout/Validator.php';
require_once __DIR__ . '/../includes/Admin/SettingsPage.php';
