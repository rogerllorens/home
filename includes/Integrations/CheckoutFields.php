<?php
declare(strict_types=1);

namespace TaxID_Guard\Integrations;

defined('ABSPATH') || exit;

class CheckoutFields
{
    public function __construct()
    {
        add_action('woocommerce_init', [$this, 'maybe_register_fields']);
    }

    public function maybe_register_fields(): void
    {
        if (! function_exists('woocommerce_register_additional_checkout_field') || get_option('tg_enable', 'yes') !== 'yes') {
            return;
        }

        $has_company_checkbox = get_option('tg_show_company_checkbox', 'yes') === 'yes';
        if ($has_company_checkbox) {
            $default_company = false;
            if (is_user_logged_in() && get_option('tg_save_taxid_profile', 'no') === 'yes') {
                $default_company = get_user_meta(get_current_user_id(), '_tg_is_company', true) === 'yes';
            }

            woocommerce_register_additional_checkout_field([
                'id' => 'taxid-guard/tg_is_company',
                'type' => 'checkbox',
                'label' => __('I am a company', 'taxid-guard-for-woocommerce'),
                'required' => false,
                'default' => $default_company,
                'location' => 'address',
            ]);
        }

        $country = $this->detect_customer_country();
        $description = $this->get_dynamic_help($country);
        if (get_option('tg_show_taxid_field', 'always') === 'company' && $has_company_checkbox) {
            $description = trim($description . ' ' . __('(Only required if “I am a company” is checked)', 'taxid-guard-for-woocommerce'));
        }

        woocommerce_register_additional_checkout_field([
            'id' => 'taxid-guard/tg_tax_id',
            'type' => 'text',
            'label' => $this->get_dynamic_label($country),
            'description' => $description,
            'placeholder' => $this->get_placeholder_by_country($country),
            'required' => false,
            'max_length' => 24,
            'attributes' => ['maxlength' => 24],
            'location' => 'address',
            'default' => is_user_logged_in() && get_option('tg_save_taxid_profile', 'no') === 'yes' ? (string) get_user_meta(get_current_user_id(), '_tg_tax_id', true) : '',
        ]);
    }

    private function detect_customer_country(): string
    {
        if (function_exists('WC') && WC()->customer) {
            $country = strtoupper((string) (WC()->customer->get_billing_country() ?: WC()->customer->get_shipping_country()));
            if (preg_match('/^[A-Z]{2}$/', $country)) {
                return $country;
            }
        }

        if (is_user_logged_in()) {
            $country = strtoupper((string) get_user_meta(get_current_user_id(), 'billing_country', true));
            if (preg_match('/^[A-Z]{2}$/', $country)) {
                return $country;
            }
        }

        $default = strtoupper(substr((string) get_option('woocommerce_default_country', ''), 0, 2));
        return preg_match('/^[A-Z]{2}$/', $default) ? $default : '';
    }

    private function get_dynamic_label(string $country): string
    {
        $dict = get_option('tg_label_by_country', []);
        if (is_array($dict) && ! empty($dict[$country])) {
            return (string) $dict[$country];
        }

        return (string) get_option('tg_taxid_label', __('Tax Identifier (NIF/CIF/NIE/VAT)', 'taxid-guard-for-woocommerce'));
    }

    private function get_dynamic_help(string $country): string
    {
        $dict = get_option('tg_help_by_country', []);
        if (is_array($dict) && ! empty($dict[$country])) {
            return (string) $dict[$country];
        }

        return (string) get_option('tg_taxid_help', __('If you purchase as a company, we need your tax identifier.', 'taxid-guard-for-woocommerce'));
    }

    private function get_placeholder_by_country(string $country): string
    {
        return $country === 'US'
            ? __('e.g. 12-3456789', 'taxid-guard-for-woocommerce')
            : __('e.g. B12345678 / X1234567T / ESB12345678', 'taxid-guard-for-woocommerce');
    }
}
