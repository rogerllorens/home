<?php
declare(strict_types=1);

namespace TaxID_Guard\Admin;

defined('ABSPATH') || exit;

class OrdersListBadge
{
    public function __construct()
    {
        add_filter('manage_edit-shop_order_columns', [$this, 'add_column']);
        add_action('manage_shop_order_posts_custom_column', [$this, 'render_column'], 10, 2);
        add_filter('woocommerce_shop_order_list_table_columns', [$this, 'add_hpos_column']);
        add_action('woocommerce_shop_order_list_table_custom_column', [$this, 'render_hpos_column'], 10, 2);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_badge_style']);
    }

    public function add_column($columns)
    {
        $columns['tg_taxid_status'] = __('Tax ID', 'taxid-guard-for-woocommerce');
        return $columns;
    }

    public function render_column($column, $post_id): void
    {
        if ($column !== 'tg_taxid_status') {
            return;
        }
        $order = wc_get_order($post_id);
        if ($order instanceof \WC_Order) {
            $this->render_badge_for_order($order);
        }
    }

    public function add_hpos_column($columns)
    {
        $new = [];
        foreach ($columns as $key => $value) {
            $new[$key] = $value;
            if ($key === 'order_status') {
                $new['tg_taxid_status'] = __('Tax ID', 'taxid-guard-for-woocommerce');
            }
        }
        return $new;
    }

    public function render_hpos_column($column, $order): void
    {
        if ($column !== 'tg_taxid_status' || ! $order instanceof \WC_Order) {
            return;
        }
        $this->render_badge_for_order($order);
    }

    private function render_badge_for_order(\WC_Order $order): void
    {
        $status = (string) $order->get_meta('_tg_tax_id_status', true);
        $method = (string) $order->get_meta('_tg_tax_id_validation', true);

        $labels = [
            'valid' => __('Valid', 'taxid-guard-for-woocommerce'),
            'invalid' => __('Invalid', 'taxid-guard-for-woocommerce'),
            'skipped' => __('Skipped', 'taxid-guard-for-woocommerce'),
            'unverified' => __('Unverified (VIES)', 'taxid-guard-for-woocommerce'),
        ];
        $classes = [
            'valid' => 'tg-badge-valid',
            'invalid' => 'tg-badge-invalid',
            'skipped' => 'tg-badge-skipped',
            'unverified' => 'tg-badge-unverified',
        ];

        echo '<span class="tg-badge ' . esc_attr($classes[$status] ?? 'tg-badge-default') . '" title="' . esc_attr($method ?: '—') . '">' . esc_html($labels[$status] ?? '—') . '</span>';
    }

    public function enqueue_badge_style($hook): void
    {
        $post_type = isset($_GET['post_type']) ? sanitize_key(wp_unslash($_GET['post_type'])) : '';
        if (($hook === 'edit.php' && $post_type === 'shop_order') || $hook === 'woocommerce_page_wc-orders') {
            wp_enqueue_style('tg-badge-style', TG_PLUGIN_URL . 'assets/tg-badge.css', [], TG_VERSION);
        }
    }
}
