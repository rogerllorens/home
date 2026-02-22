<?php
declare(strict_types=1);

namespace TaxID_Guard\Checkout;

defined('ABSPATH') || exit;

class DataExtractor
{
    public static function extract(array $payload): array
    {
        $billing = is_array($payload['billing_address'] ?? null) ? $payload['billing_address'] : [];
        $shipping = is_array($payload['shipping_address'] ?? null) ? $payload['shipping_address'] : [];

        $additional_fields = self::normalize_additional_fields($payload['additional_fields'] ?? []);

        $is_company_raw = $billing['tg_is_company']
            ?? $shipping['tg_is_company']
            ?? $additional_fields['tg_is_company']
            ?? $additional_fields['taxid-guard/tg_is_company']
            ?? '';

        $tax_id = $billing['tg_tax_id']
            ?? $shipping['tg_tax_id']
            ?? $additional_fields['tg_tax_id']
            ?? $additional_fields['taxid-guard/tg_tax_id']
            ?? '';

        $country = $billing['country']
            ?? $shipping['country']
            ?? '';

        if (! preg_match('/^[A-Z]{2}$/', strtoupper((string) $country)) && function_exists('WC') && WC()->customer) {
            $country = WC()->customer->get_billing_country() ?: WC()->customer->get_shipping_country();
        }

        $is_company = filter_var($is_company_raw, FILTER_VALIDATE_BOOLEAN);
        $is_company_present = $is_company_raw !== '' && $is_company_raw !== null;

        // Policy for Blocks/company-only mode when checkbox value is absent but customer entered tax id.
        if (! $is_company_present && $tax_id !== '' && get_option('tg_show_taxid_field', 'always') === 'company') {
            $is_company = true;
        }

        return [
            'tg_is_company' => $is_company,
            'tg_tax_id' => sanitize_text_field((string) $tax_id),
            'billing_country' => strtoupper((string) $country),
        ];
    }

    private static function normalize_additional_fields($raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $normalized = [];

        $is_assoc = array_keys($raw) !== range(0, count($raw) - 1);
        if ($is_assoc) {
            foreach ($raw as $key => $value) {
                $normalized[(string) $key] = is_scalar($value) ? $value : '';
            }
            return $normalized;
        }

        foreach ($raw as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $key = (string) ($entry['key'] ?? $entry['name'] ?? $entry['id'] ?? '');
            if ($key === '') {
                continue;
            }
            $value = $entry['value'] ?? ($entry['field_value'] ?? '');
            $normalized[$key] = is_scalar($value) ? $value : '';
        }

        return $normalized;
    }
}
