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
            $this->notice('error', __('TaxID Guard Pro requires TaxID Guard Lite 1.2.0+ active.', 'taxid-guard-pro'));
            if (is_admin() && current_user_can('activate_plugins')) {
                deactivate_plugins(plugin_basename(TG_PRO_FILE));
            }
            return;
        }

        if (!Freemius::is_active_license()) {
            $this->notice('warning', __('Activate TaxID Guard Pro license to enable VIES and advanced B2B rules.', 'taxid-guard-pro'));
            return;
        }

        (new ProHooks())->register();
    }

    private function notice(string $type, string $message): void
    {
        add_action('admin_notices', static function () use ($type, $message): void {
            echo '<div class="notice notice-' . esc_attr($type) . '"><p>' . esc_html($message) . '</p></div>';
        });
    }

    private static function lite_is_compatible(): bool
    {
        if (!defined('TG_VERSION')) {
            return false;
        }

        return version_compare((string) TG_VERSION, TG_LITE_MIN_VERSION, '>=');
    }
}
