<?php
declare(strict_types=1);

namespace TaxID_Guard\Checkout;

defined('ABSPATH') || exit;

class LocationEvidence
{
    public function __construct()
    {
        add_action('woocommerce_checkout_create_order', [$this, 'capture_for_order'], 35, 2);
        add_action('woocommerce_store_api_checkout_update_order_meta', [$this, 'capture_for_store_api'], 35, 2);
    }

    public static function compute_conflict(string $billingCountry, string $shippingCountry, string $ipCountry): bool
    {
        $billingCountry = strtoupper($billingCountry);
        $shippingCountry = strtoupper($shippingCountry);
        $ipCountry = strtoupper($ipCountry);

        if ($ipCountry === '' || $ipCountry === 'UNKNOWN') {
            return false;
        }

        if ($billingCountry === $ipCountry) {
            return false;
        }

        if ($shippingCountry !== '' && $shippingCountry === $ipCountry) {
            return false;
        }

        return $billingCountry !== '' && $billingCountry !== $ipCountry;
    }

    public function capture_for_store_api($arg1, $arg2): void
    {
        $order = $arg1 instanceof \WC_Order ? $arg1 : ($arg2 instanceof \WC_Order ? $arg2 : null);
        if ($order instanceof \WC_Order) {
            $this->capture_for_order($order, []);
        }
    }

    public function capture_for_order($order, $data = []): void
    {
        if (! $order instanceof \WC_Order || get_option('tg_collect_location_evidence', 'yes') !== 'yes') {
            return;
        }

        $billingCountry = strtoupper((string) $order->get_billing_country());
        $shippingCountry = strtoupper((string) $order->get_shipping_country());

        $storeIpMode = (string) get_option('tg_store_ip_address', 'hash');
        $ipAddress = '';
        if (class_exists('\\WC_Geolocation') && method_exists('\\WC_Geolocation', 'get_ip_address')) {
            $ipAddress = (string) \WC_Geolocation::get_ip_address();
        } elseif (! empty($_SERVER['REMOTE_ADDR'])) {
            $ipAddress = sanitize_text_field((string) $_SERVER['REMOTE_ADDR']);
        }

        $ipCountry = 'unknown';
        if ($ipAddress !== '' && class_exists('\\WC_Geolocation') && method_exists('\\WC_Geolocation', 'geolocate_ip')) {
            $geo = \WC_Geolocation::geolocate_ip($ipAddress, true, false);
            if (is_array($geo) && ! empty($geo['country'])) {
                $ipCountry = strtoupper((string) $geo['country']);
            }
        }

        $isDigital = $this->is_digital_context();
        $conflict = self::compute_conflict($billingCountry, $shippingCountry, $ipCountry);

        $order->update_meta_data('_tg_evidence_billing_country', $billingCountry);
        $order->update_meta_data('_tg_evidence_shipping_country', $shippingCountry);
        $order->update_meta_data('_tg_evidence_ip_country', $ipCountry);
        $order->update_meta_data('_tg_evidence_ip_hash', $storeIpMode === 'no' ? '' : $this->hash_ip($ipAddress));
        $order->update_meta_data('_tg_evidence_ip_address', $storeIpMode === 'yes' ? $ipAddress : '');
        $order->update_meta_data('_tg_evidence_sources', wp_json_encode(['billing', 'shipping', 'ip']));
        $order->update_meta_data('_tg_evidence_timestamp', gmdate('c'));
        $order->update_meta_data('_tg_evidence_conflict', $conflict ? 'yes' : 'no');
        $order->update_meta_data('_tg_digital_goods', $isDigital ? 'yes' : 'no');
    }

    private function hash_ip(string $ipAddress): string
    {
        if ($ipAddress === '') {
            return '';
        }

        return substr(hash('sha256', $ipAddress . wp_salt('auth')), 0, 16);
    }

    private function is_digital_context(): bool
    {
        $mode = (string) get_option('tg_digital_goods_mode', 'auto_detect_virtual_only');
        if ($mode === 'disabled') {
            return false;
        }
        if ($mode === 'always_treat_as_digital') {
            return true;
        }

        if (! function_exists('WC') || ! WC()->cart || ! method_exists(WC()->cart, 'get_cart')) {
            return false;
        }

        $cart = WC()->cart->get_cart();
        if (! is_array($cart) || $cart === []) {
            return false;
        }

        foreach ($cart as $line) {
            $product = $line['data'] ?? null;
            if (! $product || ! method_exists($product, 'is_virtual') || ! method_exists($product, 'is_downloadable')) {
                return false;
            }
            if (! $product->is_virtual() && ! $product->is_downloadable()) {
                return false;
            }
        }

        return true;
    }
}
