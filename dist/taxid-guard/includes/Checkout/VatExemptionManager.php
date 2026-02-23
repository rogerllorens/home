<?php
declare(strict_types=1);

namespace TaxID_Guard\Checkout;

defined('ABSPATH') || exit;

class VatExemptionManager
{
    public function __construct()
    {
        add_filter('woocommerce_customer_is_vat_exempt', [$this, 'filter_customer_vat_exempt'], 20, 2);
        add_action('woocommerce_checkout_create_order', [$this, 'save_order_meta'], 30, 2);
        add_action('woocommerce_store_api_checkout_update_order_meta', [$this, 'save_order_meta_store_api'], 30, 2);
    }

    public static function should_apply_exemption(string $mode, string $baseCountry, string $billingCountry, bool $isCompany, bool $isVatValid, bool $isCollectMode): array
    {
        if ($isCollectMode || ! $isCompany || ! $isVatValid || $mode === 'off') {
            return ['apply' => false, 'reason' => 'not_eligible'];
        }

        $baseCountry = strtoupper(substr($baseCountry, 0, 2));
        $billingCountry = strtoupper(substr($billingCountry, 0, 2));

        switch ($mode) {
            case 'exempt_when_valid_anywhere':
                return ['apply' => true, 'reason' => 'valid_anywhere'];
            case 'preserve_vat_in_base_country_only':
                return ['apply' => $billingCountry !== '' && $billingCountry !== $baseCountry, 'reason' => $billingCountry === $baseCountry ? 'base_country_preserved' : 'outside_base'];
            case 'exempt_when_valid_outside_base_country':
            default:
                return ['apply' => $billingCountry !== '' && $billingCountry !== $baseCountry, 'reason' => $billingCountry === $baseCountry ? 'base_country' : 'outside_base'];
        }
    }

    public function update_session_from_validation(array $payload): void
    {
        if (! function_exists('WC') || ! WC()->session) {
            return;
        }

        $mode = (string) get_option('tg_vat_exemption_mode', 'off');
        $collectMode = get_option('tg_mode', 'validate') === 'collect';
        $base = strtoupper(substr((string) get_option('woocommerce_default_country', ''), 0, 2));
        $billing = strtoupper(substr((string) ($payload['country'] ?? ''), 0, 2));
        $isCompany = ! empty($payload['is_company']);
        $isValid = ($payload['ok'] ?? false) === true && ! empty($payload['tax_id']) && (($payload['code'] ?? '') === 'TG_VALID');

        $decision = self::should_apply_exemption($mode, $base, $billing, $isCompany, $isValid, $collectMode);

        WC()->session->set('tg_vat_exemption', [
            'apply' => (bool) $decision['apply'],
            'reason' => (string) $decision['reason'],
            'mode' => $mode,
            'country' => $billing,
            'base_country' => $base,
        ]);
    }

    public function filter_customer_vat_exempt(bool $isExempt, $customer): bool
    {
        if (! function_exists('WC') || ! WC()->session) {
            return $isExempt;
        }

        $state = WC()->session->get('tg_vat_exemption');
        if (! is_array($state)) {
            return $isExempt;
        }

        return ! empty($state['apply']) ? true : $isExempt;
    }

    public function save_order_meta($order): void
    {
        if (! $order instanceof \WC_Order || ! function_exists('WC') || ! WC()->session) {
            return;
        }

        $state = WC()->session->get('tg_vat_exemption');
        if (! is_array($state)) {
            return;
        }

        $order->update_meta_data('_tg_vat_exempt_applied', ! empty($state['apply']) ? 'yes' : 'no');
        $order->update_meta_data('_tg_vat_exempt_reason', (string) ($state['reason'] ?? 'unknown'));
        $order->update_meta_data('_tg_vat_exempt_mode', (string) ($state['mode'] ?? 'off'));
    }

    public function save_order_meta_store_api($arg1, $arg2): void
    {
        $order = $arg1 instanceof \WC_Order ? $arg1 : ($arg2 instanceof \WC_Order ? $arg2 : null);
        if ($order instanceof \WC_Order) {
            $this->save_order_meta($order);
        }
    }
}
