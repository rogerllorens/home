<?php
declare(strict_types=1);
/**
 * Plugin Name: TaxID Guard for WooCommerce (Pro)
 * Description: Pro add-on for TaxID Guard Lite: VIES, advanced rules and exports.
 * Version: 1.0.0
 * Author: Rogix
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Text Domain: taxid-guard-pro
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TG_PRO_FILE', __FILE__);
define('TG_PRO_PATH', plugin_dir_path(__FILE__));
define('TG_PRO_VERSION', '1.0.0');
define('TG_LITE_MIN_VERSION', '1.2.0');

spl_autoload_register(static function (string $class): void {
    $prefix = 'TaxID_Guard_Pro\\';
    if (strpos($class, $prefix) !== 0) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = TG_PRO_PATH . 'includes/' . str_replace('\\', '/', $relative) . '.php';
    if (is_readable($file)) {
        require_once $file;
    }
});

register_activation_hook(__FILE__, ['TaxID_Guard_Pro\\BootstrapPro', 'on_activation']);

add_action('plugins_loaded', static function (): void {
    TaxID_Guard_Pro\BootstrapPro::instance()->boot();
});
