<?php
declare(strict_types=1);

namespace TaxID_Guard\Admin;

defined('ABSPATH') || exit;

class VatRatesPage
{
    private const RATES = [
        'AT' => 20.0, 'BE' => 21.0, 'BG' => 20.0, 'HR' => 25.0, 'CY' => 19.0, 'CZ' => 21.0,
        'DK' => 25.0, 'EE' => 22.0, 'FI' => 24.0, 'FR' => 20.0, 'DE' => 19.0, 'GR' => 24.0,
        'HU' => 27.0, 'IE' => 23.0, 'IT' => 22.0, 'LV' => 21.0, 'LT' => 21.0, 'LU' => 17.0,
        'MT' => 18.0, 'NL' => 21.0, 'PL' => 23.0, 'PT' => 23.0, 'RO' => 19.0, 'SK' => 20.0,
        'SI' => 22.0, 'ES' => 21.0, 'SE' => 25.0,
    ];

    public function __construct()
    {
        add_action('admin_menu', [$this, 'register_page']);
        add_action('admin_post_tg_install_vat_rates', [$this, 'handle_install']);
    }

    public static function merge_rates(array $existing, array $incoming): array
    {
        $merged = $existing;
        foreach ($incoming as $country => $rate) {
            if (! array_key_exists($country, $merged)) {
                $merged[$country] = $rate;
            }
        }
        return $merged;
    }

    public function register_page(): void
    {
        add_submenu_page(
            'woocommerce',
            __('VAT Rates Import', 'taxid-guard-for-woocommerce'),
            __('VAT Rates Import', 'taxid-guard-for-woocommerce'),
            'manage_woocommerce',
            'tg-vat-rates',
            [$this, 'render']
        );
    }

    public function render(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        $taxesEnabled = get_option('woocommerce_calc_taxes', 'no') === 'yes';

        echo '<div class="wrap"><h1>' . esc_html__('VAT Rates Import', 'taxid-guard-for-woocommerce') . '</h1>';
        if (! $taxesEnabled) {
            echo '<div class="notice notice-warning"><p>' . esc_html__('WooCommerce taxes are disabled. Enable taxes before importing VAT rates.', 'taxid-guard-for-woocommerce') . '</p></div>';
        }

        echo '<p>' . esc_html__('Install EU standard VAT rates (standard class) without duplicating existing country rates.', 'taxid-guard-for-woocommerce') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        wp_nonce_field('tg_install_vat_rates', 'tg_install_vat_rates_nonce');
        echo '<input type="hidden" name="action" value="tg_install_vat_rates" />';
        submit_button(__('Install EU standard VAT rates', 'taxid-guard-for-woocommerce'));
        echo '</form>';
        echo '</div>';
    }

    public function handle_install(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        check_admin_referer('tg_install_vat_rates', 'tg_install_vat_rates_nonce');

        if (class_exists('WC_Tax')) {
            $existing = [];
            $rates = \WC_Tax::get_rates_for_tax_class('');
            if (is_array($rates)) {
                foreach ($rates as $r) {
                    $country = strtoupper((string) ($r->tax_rate_country ?? ''));
                    if ($country !== '') {
                        $existing[$country] = true;
                    }
                }
            }

            foreach (self::RATES as $country => $rate) {
                if (! empty($existing[$country])) {
                    continue;
                }

                if (function_exists('WC') && method_exists('WC', 'countries')) {
                    $countryName = WC()->countries ? WC()->countries->countries[$country] ?? $country : $country;
                } else {
                    $countryName = $country;
                }

                if (function_exists('WC_Tax::_insert_tax_rate')) {
                    \WC_Tax::_insert_tax_rate([
                        'tax_rate_country' => $country,
                        'tax_rate' => (string) $rate,
                        'tax_rate_name' => sprintf(__('VAT %s', 'taxid-guard-for-woocommerce'), $countryName),
                        'tax_rate_priority' => 1,
                        'tax_rate_compound' => 0,
                        'tax_rate_shipping' => 1,
                        'tax_rate_order' => 0,
                        'tax_rate_class' => '',
                    ]);
                }
            }
        }

        wp_safe_redirect(admin_url('admin.php?page=tg-vat-rates'));
        exit;
    }
}
