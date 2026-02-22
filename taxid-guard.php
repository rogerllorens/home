<?php
declare(strict_types=1);
/**
 * Plugin Name: TaxID Guard for WooCommerce (Blocks)
 * Description: Adds a Tax Identifier (NIF/CIF/NIE/VAT/EIN) field to WooCommerce checkout (Classic + Blocks).
 * Version: 1.2.0
 * Author: Rogix
 * Text Domain: taxid-guard-for-woocommerce
 * Domain Path: /languages
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * WC requires at least: 8.9
 * WC tested up to: 9.2
 * Requires Plugins: woocommerce
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (! defined('ABSPATH')) {
    exit;
}

define('TG_PLUGIN_FILE', __FILE__);
define('TG_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('TG_PLUGIN_URL', plugin_dir_url(__FILE__));
define('TG_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('TG_VERSION', '1.2.0');

add_action('before_woocommerce_init', static function () {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', TG_PLUGIN_FILE, true);
    }
});

if (! function_exists('tg_fs')) {
    function tg_fs()
    {
        static $tg_fs = null;

        if ($tg_fs !== null) {
            return $tg_fs;
        }

        $sdk_path = TG_PLUGIN_PATH . 'freemius/start.php';
        if (! file_exists($sdk_path)) {
            $tg_fs = false;
            return $tg_fs;
        }

        try {
            require_once $sdk_path;
            $tg_fs = fs_dynamic_init([
                'id' => 'YOUR_FREEMIUM_ID',
                'slug' => 'taxid-guard-for-woocommerce',
                'type' => 'plugin',
                'public_key' => 'YOUR_PUBLIC_KEY',
                'is_premium' => false,
                'has_premium_version' => true,
                'has_addons' => false,
                'has_paid_plans' => true,
                'menu' => ['slug' => 'tg_taxid_guard'],
            ]);
        } catch (\Throwable $e) {
            $tg_fs = false;
        }

        return $tg_fs;
    }

    if (tg_fs()) {
        do_action('tg_fs_loaded');
    }
}

spl_autoload_register(static function ($class) {
    $prefix = 'TaxID_Guard\\';
    if (strpos($class, $prefix) !== 0) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = TG_PLUGIN_PATH . 'includes/' . str_replace('\\', '/', $relative) . '.php';
    if (is_readable($file)) {
        require_once $file;
    }
});

add_action('plugins_loaded', static function () {
    if (! class_exists('WooCommerce')) {
        add_action('admin_notices', static function () {
            if (! current_user_can('activate_plugins')) {
                return;
            }
            echo '<div class="notice notice-error"><p>';
            esc_html_e('TaxID Guard for WooCommerce requires WooCommerce to be installed and active.', 'taxid-guard-for-woocommerce');
            echo '</p></div>';
        });
        return;
    }

    if (class_exists('TaxID_Guard\\Admin\\SettingsMigrator')) {
        TaxID_Guard\Admin\SettingsMigrator::run();
    }

    TaxID_Guard\Bootstrap::instance();
});
