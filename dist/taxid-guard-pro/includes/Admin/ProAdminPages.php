<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro\Admin;

use TaxID_Guard_Pro\Pro\ViesService;

final class ProAdminPages
{
    public function register(): void
    {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_post_tg_pro_vies_test', [$this, 'handle_vies_test']);
        add_action('admin_post_tg_pro_export_report', [$this, 'handle_export']);
    }

    public function register_menu(): void
    {
        add_submenu_page(
            'woocommerce',
            __('TaxID Guard Pro Readiness', 'taxid-guard-pro'),
            __('TaxID Guard Pro', 'taxid-guard-pro'),
            'manage_woocommerce',
            'tg-pro-readiness',
            [$this, 'render_readiness_page']
        );
    }

    public function render_readiness_page(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            return;
        }

        $checks = $this->get_readiness_checks();
        $viesResult = get_transient('tg_pro_vies_test_result');

        echo '<div class="wrap"><h1>' . esc_html__('TaxID Guard Pro Readiness', 'taxid-guard-pro') . '</h1>';
        echo '<table class="widefat striped"><thead><tr><th>' . esc_html__('Check', 'taxid-guard-pro') . '</th><th>' . esc_html__('Status', 'taxid-guard-pro') . '</th><th>' . esc_html__('Details', 'taxid-guard-pro') . '</th></tr></thead><tbody>';
        foreach ($checks as $check) {
            $statusLabel = $check['ok'] ? __('OK', 'taxid-guard-pro') : __('Needs attention', 'taxid-guard-pro');
            echo '<tr><td>' . esc_html($check['label']) . '</td><td>' . esc_html($statusLabel) . '</td><td>' . esc_html($check['details']) . '</td></tr>';
        }
        echo '</tbody></table>';

        echo '<h2>' . esc_html__('VIES Test', 'taxid-guard-pro') . '</h2>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        wp_nonce_field('tg_pro_vies_test', 'tg_pro_vies_test_nonce');
        echo '<input type="hidden" name="action" value="tg_pro_vies_test" />';
        echo '<label>' . esc_html__('Country', 'taxid-guard-pro') . ' <input type="text" name="country" value="ES" maxlength="2" /></label> ';
        echo '<label>' . esc_html__('VAT', 'taxid-guard-pro') . ' <input type="text" name="vat" value="" /></label> ';
        submit_button(__('Run VIES test', 'taxid-guard-pro'), 'secondary', 'submit', false);
        echo '</form>';

        if (is_array($viesResult)) {
            echo '<p><strong>' . esc_html__('Last VIES test:', 'taxid-guard-pro') . '</strong> ' . esc_html(wp_json_encode($viesResult)) . '</p>';
        }

        echo '<h2>' . esc_html__('Exports', 'taxid-guard-pro') . '</h2>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        wp_nonce_field('tg_pro_export_report', 'tg_pro_export_report_nonce');
        echo '<input type="hidden" name="action" value="tg_pro_export_report" />';
        echo '<label>' . esc_html__('Type', 'taxid-guard-pro') . ' ';
        echo '<select name="report_type"><option value="vies_supplies">VIES supplies</option><option value="country_summary">Country summary</option><option value="oss_lite">OSS-lite</option></select></label> ';
        submit_button(__('Download CSV', 'taxid-guard-pro'), 'secondary', 'submit', false);
        echo '</form></div>';
    }

    public function handle_vies_test(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Unauthorized', 'taxid-guard-pro'));
        }

        check_admin_referer('tg_pro_vies_test', 'tg_pro_vies_test_nonce');

        $country = sanitize_text_field((string) ($_POST['country'] ?? ''));
        $vat = sanitize_text_field((string) ($_POST['vat'] ?? ''));

        $service = new ViesService();
        $started = microtime(true);
        $result = $service->check($country, $vat);
        $result['latency_ms'] = (int) round((microtime(true) - $started) * 1000);

        set_transient('tg_pro_vies_test_result', $result, 10 * MINUTE_IN_SECONDS);
        wp_safe_redirect(admin_url('admin.php?page=tg-pro-readiness'));
        exit;
    }

    public function handle_export(): void
    {
        if (! current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('Unauthorized', 'taxid-guard-pro'));
        }

        check_admin_referer('tg_pro_export_report', 'tg_pro_export_report_nonce');

        $type = sanitize_key((string) ($_POST['report_type'] ?? 'vies_supplies'));
        $rows = $this->build_rows($type);

        nocache_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="tg-pro-' . $type . '-' . gmdate('Ymd-His') . '.csv"');

        $out = fopen('php://output', 'w');
        if (! $out) {
            exit;
        }

        if (!empty($rows)) {
            fputcsv($out, array_keys($rows[0]));
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
        }

        fclose($out);
        exit;
    }

    private function build_rows(string $type): array
    {
        if (! class_exists('WC_Order_Query')) {
            return [];
        }

        $query = new \WC_Order_Query([
            'limit' => 200,
            'status' => array_keys(wc_get_order_statuses()),
            'return' => 'objects',
        ]);
        $orders = $query->get_orders();
        if (!is_array($orders)) {
            return [];
        }

        $rows = [];
        $summary = [];
        foreach ($orders as $order) {
            if (! $order instanceof \WC_Order) {
                continue;
            }

            $country = (string) $order->get_billing_country();
            $row = [
                'order_id' => (string) $order->get_id(),
                'date' => (string) $order->get_date_created()?->date('Y-m-d'),
                'country' => $country,
                'vat_number' => (string) $order->get_meta('_billing_tax_id'),
                'company' => (string) $order->get_meta('_billing_company'),
                'vies_status' => (string) $order->get_meta('_tg_vies_status'),
                'net_total' => (string) (((float) $order->get_total()) - ((float) $order->get_total_tax())),
                'tax_total' => (string) $order->get_total_tax(),
            ];

            if ($type === 'vies_supplies' && $order->get_meta('_tg_vat_exempt_applied') !== 'yes') {
                continue;
            }

            if ($type === 'country_summary') {
                $summary[$country] = $summary[$country] ?? ['country' => $country, 'orders' => 0, 'tax_total' => 0.0, 'net_total' => 0.0];
                $summary[$country]['orders']++;
                $summary[$country]['tax_total'] += (float) $order->get_total_tax();
                $summary[$country]['net_total'] += ((float) $order->get_total() - (float) $order->get_total_tax());
                continue;
            }

            $rows[] = $row;
        }

        if ($type === 'country_summary') {
            return array_values($summary);
        }

        return $rows;
    }

    private function get_readiness_checks(): array
    {
        $taxEnabled = get_option('woocommerce_calc_taxes', 'no') === 'yes';
        $geo = class_exists('WC_Geolocation');
        $soap = class_exists('\SoapClient');
        $blocks = class_exists('\Automattic\\WooCommerce\\Blocks\\Package');
        $showTaxId = get_option('tg_show_taxid', 'yes') === 'yes';
        $requiredIfCompany = get_option('tg_required_if_company', 'yes') === 'yes';

        return [
            ['label' => __('Taxes enabled', 'taxid-guard-pro'), 'ok' => $taxEnabled, 'details' => $taxEnabled ? __('Woo taxes are enabled.', 'taxid-guard-pro') : __('Enable WooCommerce taxes for VAT handling.', 'taxid-guard-pro')],
            ['label' => __('GeoIP available', 'taxid-guard-pro'), 'ok' => $geo, 'details' => $geo ? __('WC_Geolocation is available.', 'taxid-guard-pro') : __('GeoIP unavailable. IP evidence may be incomplete.', 'taxid-guard-pro')],
            ['label' => __('SOAP available', 'taxid-guard-pro'), 'ok' => $soap, 'details' => $soap ? __('SOAP extension available for VIES.', 'taxid-guard-pro') : __('Install PHP SOAP extension for VIES.', 'taxid-guard-pro')],
            ['label' => __('Blocks support', 'taxid-guard-pro'), 'ok' => true, 'details' => $blocks ? __('Checkout Blocks detected.', 'taxid-guard-pro') : __('Classic checkout detected.', 'taxid-guard-pro')],
            ['label' => __('Settings consistency', 'taxid-guard-pro'), 'ok' => !(!$showTaxId && $requiredIfCompany), 'details' => (!$showTaxId && $requiredIfCompany) ? __('Conflict: VAT hidden but required when company.', 'taxid-guard-pro') : __('No critical settings conflicts found.', 'taxid-guard-pro')],
        ];
    }
}
