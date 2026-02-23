<?php
declare(strict_types=1);

namespace TaxID_Guard\Admin;

use Automattic\WooCommerce\Utilities\OrderUtil;

defined('ABSPATH') || exit;

class AdminDisplay
{
    public function __construct()
    {
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('woocommerce_admin_order_data_after_billing_address', [$this, 'order_admin_meta']);
        add_action('woocommerce_email_order_meta', [$this, 'order_email_meta'], 10, 3);
    }

    private function is_hpos_enabled(): bool
    {
        return class_exists(OrderUtil::class)
            && method_exists(OrderUtil::class, 'custom_orders_table_usage_is_enabled')
            && OrderUtil::custom_orders_table_usage_is_enabled();
    }

    public function add_meta_boxes(): void
    {
        if ($this->is_hpos_enabled()) {
            return;
        }

        add_meta_box('tg_taxid_meta', __('Tax Identifier', 'taxid-guard-for-woocommerce'), [$this, 'render_meta_box'], 'shop_order', 'side', 'default');
    }

    public function render_meta_box($post): void
    {
        $order = wc_get_order(is_object($post) && isset($post->ID) ? (int) $post->ID : 0);
        if (! $order) {
            return;
        }

        $tax_id = (string) $order->get_meta('_tg_tax_id', true);
        $status = (string) $order->get_meta('_tg_tax_id_status', true);
        $method = (string) $order->get_meta('_tg_tax_id_validation', true);

        if ($tax_id === '' && $status === '' && $method === '') {
            echo '<p>' . esc_html__('No Tax ID data stored for this order.', 'taxid-guard-for-woocommerce') . '</p>';
            return;
        }

        echo '<p><strong>' . esc_html__('Tax ID:', 'taxid-guard-for-woocommerce') . '</strong> ' . esc_html($tax_id ?: '—') . '</p>';
        echo '<p><strong>' . esc_html__('Status:', 'taxid-guard-for-woocommerce') . '</strong> ' . esc_html($this->status_label($status)) . '</p>';
        echo '<p><strong>' . esc_html__('Method:', 'taxid-guard-for-woocommerce') . '</strong> ' . esc_html($method ?: '—') . '</p>';
    }

    public function order_admin_meta($order): void
    {
        if ('yes' !== get_option('tg_show_in_admin', 'yes') || ! $order instanceof \WC_Order) {
            return;
        }
        $tax_id = (string) $order->get_meta('_tg_tax_id', true);
        if ($tax_id === '') {
            return;
        }

        echo '<p><strong>' . esc_html((string) get_option('tg_taxid_label', __('Tax Identifier', 'taxid-guard-for-woocommerce'))) . ':</strong> ' . esc_html($tax_id) . '</p>';
    }

    public function order_email_meta($order, $sent_to_admin, $plain_text): void
    {
        if (! $order instanceof \WC_Order) {
            return;
        }
        $tax_id = (string) $order->get_meta('_tg_tax_id', true);
        if ($tax_id === '') {
            return;
        }

        if ($sent_to_admin) {
            if ('yes' !== get_option('tg_email_admin', 'yes')) {
                return;
            }
            $this->print_email_line((string) get_option('tg_taxid_label', __('Tax Identifier', 'taxid-guard-for-woocommerce')), $tax_id, (bool) $plain_text);
            return;
        }

        if ('yes' !== get_option('tg_email_customer', 'no')) {
            return;
        }

        $value = get_option('tg_mask_customer_email', 'no') === 'yes' ? $this->mask($tax_id) : $tax_id;
        $this->print_email_line((string) get_option('tg_taxid_label', __('Tax Identifier', 'taxid-guard-for-woocommerce')), $value, (bool) $plain_text);
    }

    private function print_email_line(string $label, string $value, bool $plain_text): void
    {
        if ($plain_text) {
            echo "\n{$label}: {$value}\n";
            return;
        }
        echo '<p><strong>' . esc_html($label) . ':</strong> <span>' . esc_html($value) . '</span></p>';
    }

    private function mask(string $tax_id): string
    {
        $len = strlen($tax_id);
        if ($len <= 5) {
            return str_repeat('*', $len);
        }
        return substr($tax_id, 0, 3) . str_repeat('*', $len - 5) . substr($tax_id, -2);
    }

    private function status_label(string $status): string
    {
        $labels = [
            'valid' => __('Valid', 'taxid-guard-for-woocommerce'),
            'invalid' => __('Invalid', 'taxid-guard-for-woocommerce'),
            'skipped' => __('Skipped', 'taxid-guard-for-woocommerce'),
            'unverified' => __('Unverified (VIES)', 'taxid-guard-for-woocommerce'),
        ];
        return $labels[$status] ?? ($status !== '' ? ucfirst($status) : '—');
    }
}
