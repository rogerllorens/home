<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro;

final class BootstrapPro
{
    private static ?self $instance = null;

    public static function instance(): self
    {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function on_activation(): void
    {
        if (!self::lite_is_compatible()) {
            deactivate_plugins(plugin_basename(TG_PRO_FILE));
            wp_die(esc_html__('TaxID Guard Pro requires TaxID Guard Lite 1.2.0+ active.', 'taxid-guard-pro'));
        }
    }

    public function boot(): void
    {
        if (!self::lite_is_compatible()) {
            add_action('admin_notices', static function (): void {
                echo '<div class="notice notice-error"><p>' . esc_html__('TaxID Guard Pro requires TaxID Guard Lite 1.2.0+ active.', 'taxid-guard-pro') . '</p></div>';
            });
            return;
        }

        if (!Freemius::is_active_license()) {
            add_action('admin_notices', static function (): void {
                echo '<div class="notice notice-warning"><p>' . esc_html__('TaxID Guard Pro license is not active.', 'taxid-guard-pro') . '</p></div>';
            });
            return;
        }

        (new ProHooks())->register();
    }

    private static function lite_is_compatible(): bool
    {
        if (!defined('TG_VERSION')) {
            return false;
        }
        return version_compare((string) TG_VERSION, TG_LITE_MIN_VERSION, '>=');
    }
}
