<?php
declare(strict_types=1);

namespace TaxID_Guard\Admin;

use TaxID_Guard\Bootstrap;

defined('ABSPATH') || exit;

final class DebugPage
{
    public function __construct()
    {
        add_action('admin_menu', [$this, 'register_menu']);
    }

    public function register_menu(): void
    {
        add_submenu_page('woocommerce', __('TaxID Debug', 'taxid-guard-for-woocommerce'), __('TaxID Debug', 'taxid-guard-for-woocommerce'), 'manage_woocommerce', 'tg-taxid-debug', [$this, 'render']);
    }

    public function render(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Insufficient permissions.', 'taxid-guard-for-woocommerce'));
        }

        $data = [
            'checkout_context' => Bootstrap::instance()->debug_checkout_context(),
            'resolved_country' => function_exists('WC') && WC()->customer ? (WC()->customer->get_billing_country() ?: WC()->customer->get_shipping_country()) : '',
            'mode' => get_option('tg_mode', 'validate'),
            'company_required' => get_option('tg_company_requires_taxid', 'yes'),
        ];

        echo '<div class="wrap"><h1>' . esc_html__('TaxID Guard Debug', 'taxid-guard-for-woocommerce') . '</h1><table class="widefat striped">';
        foreach ($data as $k => $v) {
            echo '<tr><th style="width:240px">' . esc_html((string) $k) . '</th><td>' . esc_html(is_scalar($v) ? (string) $v : wp_json_encode($v)) . '</td></tr>';
        }
        echo '</table><p class="description">' . esc_html__('No sensitive tax ID data is displayed here.', 'taxid-guard-for-woocommerce') . '</p></div>';
    }
}
