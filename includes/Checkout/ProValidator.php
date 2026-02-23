<?php
declare(strict_types=1);

namespace TaxID_Guard\Checkout;

use TaxID_Guard\Pro\Vies\ViesService;

defined('ABSPATH') || exit;

class ProValidator extends Validator
{
    private ViesService $vies_service;

    public function __construct()
    {
        $this->vies_service = new ViesService();
        parent::__construct();
    }

    protected function validate_by_country(string $country, string $tax_id): array
    {
        $base = parent::validate_by_country($country, $tax_id);
        if (! $base['valid']) {
            return $base;
        }

        $vat_country = $this->country_to_vat_prefix($country);

        if (preg_match('/^[A-Z]{2}/', $tax_id)) {
            $possible = strtoupper(substr($tax_id, 0, 2));
            $possible = $this->country_to_vat_prefix($possible);
            if ($this->is_eu_country($possible)) {
                $vat_country = $possible;
                $tax_id = substr($tax_id, 2);
            }
        }

        if ($vat_country !== 'ES' && $this->is_eu_country($vat_country) && get_option('tg_pro_vies', 'no') === 'yes') {
            $vies = $this->vies_service->check($vat_country, $tax_id);

            $this->add_temp_meta([
                '_tg_vies_valid' => $vies['valid'] === true ? 'yes' : ($vies['valid'] === false ? 'no' : ''),
                '_tg_vies_checked_at' => current_time('timestamp'),
                '_tg_vies_name' => $vies['name'] ?? '',
                '_tg_vies_address' => $vies['address'] ?? '',
                '_tg_vies_error' => $vies['error'] ?? '',
                '_tg_vies_source' => $vies['source'] ?? '',
            ]);

            $fail_mode = get_option('tg_vies_fail_mode', 'block');

            if (($vies['valid'] ?? null) === false) {
                $msg = __('The VAT number is invalid according to VIES.', 'taxid-guard-for-woocommerce');
                if ($fail_mode === 'block') {
                    return ['valid' => false, 'method' => 'vies_invalid', 'status' => 'invalid', 'code' => 'TG_VIES_INVALID', 'message' => $msg];
                }

                return ['valid' => true, 'method' => 'vies_invalid', 'status' => 'invalid', 'code' => 'TG_VIES_INVALID_ALLOWED', 'message' => __('Invalid VAT according to VIES, store allows checkout.', 'taxid-guard-for-woocommerce')];
            }

            if (($vies['valid'] ?? null) === true) {
                $base['method'] = 'vies_valid';
                $base['code'] = 'TG_VALID';
            }

            if (($vies['valid'] ?? null) === null) {
                $msg = __('VAT could not be verified now. Please try later.', 'taxid-guard-for-woocommerce');
                if ($fail_mode === 'block') {
                    return ['valid' => false, 'method' => 'vies_error', 'status' => 'unverified', 'code' => 'TG_VIES_UNAVAILABLE_BLOCKED', 'message' => $msg];
                }

                return ['valid' => true, 'method' => 'vies_error', 'status' => 'unverified', 'code' => 'TG_VIES_UNAVAILABLE_ALLOWED', 'message' => $msg];
            }
        }

        return $base;
    }

    protected function pro_additional_requirements(string $country, bool $is_company): bool
    {
        $required = false;

        $roles = $this->normalise_string_array(get_option('tg_required_roles', []));
        if ($roles) {
            $user = wp_get_current_user();
            if (array_intersect($roles, (array) $user->roles)) {
                $required = true;
            }
        }

        $threshold = floatval((string) get_option('tg_cart_total_threshold', ''));
        if ($threshold > 0 && function_exists('WC') && WC()->cart && WC()->cart->total >= $threshold) {
            $required = true;
        }

        $store_base = strtoupper(substr((string) get_option('woocommerce_default_country', ''), 0, 2));
        if (preg_match('/^[A-Z]{2}$/', $store_base)) {
            if ($is_company && $country !== $store_base && $this->is_eu_country($this->country_to_vat_prefix($country))) {
                $required = true;
            }
        }

        return $required;
    }

    protected function pro_should_skip_requirement(string $country, bool $is_company): bool
    {
        $exclude_pay = $this->normalise_string_array(get_option('tg_exclude_payment_methods', []));
        if ($exclude_pay && function_exists('WC') && WC()->session) {
            $chosen = WC()->session->get('chosen_payment_method');
            if ($chosen && in_array($chosen, $exclude_pay, true)) {
                return true;
            }
        }

        $exclude_ship = $this->normalise_string_array(get_option('tg_exclude_shipping_methods', []));
        if ($exclude_ship && function_exists('WC') && WC()->session) {
            $chosen = (array) WC()->session->get('chosen_shipping_methods');
            if ($chosen && array_intersect($chosen, $exclude_ship)) {
                return true;
            }
        }

        if ('yes' === get_option('tg_exclude_virtual_orders', 'no') && function_exists('WC') && WC()->cart) {
            $has_physical = false;
            foreach (WC()->cart->get_cart() as $item) {
                $product = $item['data'] ?? null;
                if ($product && ! $product->is_virtual()) {
                    $has_physical = true;
                    break;
                }
            }
            if (! $has_physical) {
                return true;
            }
        }

        return false;
    }
}
