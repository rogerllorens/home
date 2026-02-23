<?php
declare(strict_types=1);

namespace TaxID_Guard\Classic;

use TaxID_Guard\Domain\TaxIdNormalizer;

defined('ABSPATH') || exit;

class AccountVatFields
{
    public function __construct()
    {
        add_action('woocommerce_register_form', [$this, 'render_signup_field']);
        add_action('woocommerce_created_customer', [$this, 'save_signup_field']);
        add_action('woocommerce_edit_account_form', [$this, 'render_account_field']);
        add_action('woocommerce_save_account_details', [$this, 'save_account_field']);
    }

    public function render_signup_field(): void
    {
        if (get_option('tg_collect_vat_on_signup', 'no') !== 'yes') {
            return;
        }

        echo '<p class="form-row form-row-wide">';
        echo '<label for="tg_signup_vat">' . esc_html__('VAT / Tax ID', 'taxid-guard-for-woocommerce') . '</label>';
        echo '<input type="text" class="input-text" name="tg_signup_vat" id="tg_signup_vat" value="' . esc_attr((string) ($_POST['tg_signup_vat'] ?? '')) . '" />';
        echo '</p>';
    }

    public function save_signup_field(int $customerId): void
    {
        if (get_option('tg_collect_vat_on_signup', 'no') !== 'yes') {
            return;
        }

        $raw = sanitize_text_field((string) wp_unslash($_POST['tg_signup_vat'] ?? ''));
        $vat = TaxIdNormalizer::normalize($raw);
        if ($vat !== '') {
            update_user_meta($customerId, '_tg_tax_id', $vat);
            update_user_meta($customerId, '_tg_is_company', 'yes');
        }
    }

    public function render_account_field(): void
    {
        if (get_option('tg_collect_vat_on_signup', 'no') !== 'yes' || ! is_user_logged_in()) {
            return;
        }

        $value = (string) get_user_meta(get_current_user_id(), '_tg_tax_id', true);

        echo '<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">';
        echo '<label for="account_tg_tax_id">' . esc_html__('VAT / Tax ID', 'taxid-guard-for-woocommerce') . '</label>';
        echo '<input type="text" class="woocommerce-Input woocommerce-Input--text input-text" name="account_tg_tax_id" id="account_tg_tax_id" value="' . esc_attr($value) . '" />';
        echo '</p>';
    }

    public function save_account_field(int $userId): void
    {
        if (get_option('tg_collect_vat_on_signup', 'no') !== 'yes') {
            return;
        }

        $raw = sanitize_text_field((string) wp_unslash($_POST['account_tg_tax_id'] ?? ''));
        $vat = TaxIdNormalizer::normalize($raw);

        if ($vat === '') {
            delete_user_meta($userId, '_tg_tax_id');
            update_user_meta($userId, '_tg_is_company', 'no');
            return;
        }

        update_user_meta($userId, '_tg_tax_id', $vat);
        update_user_meta($userId, '_tg_is_company', 'yes');
    }
}
