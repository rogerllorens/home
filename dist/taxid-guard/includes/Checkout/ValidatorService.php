<?php
declare(strict_types=1);

namespace TaxID_Guard\Checkout;

use TaxID_Guard\Domain\TaxIdNormalizer;
use TaxID_Guard\Domain\TaxIdValidatorES;
use TaxID_Guard\Domain\TaxIdValidatorEU;
use TaxID_Guard\ValueObjects\TaxIdInput;
use TaxID_Guard\ValueObjects\ValidationResult;
use WC_REST_Exception;

defined('ABSPATH') || exit;

class ValidatorService
{
    protected array $temp = [];
    protected $logger;

    public function __construct()
    {
        $this->logger = \TaxID_Guard\Bootstrap::get_logger();
    }

    public function validate_classic_post(array $posted_data): ValidationResult
    {
        $input = new TaxIdInput(
            filter_var($posted_data['tg_is_company'] ?? false, FILTER_VALIDATE_BOOLEAN),
            TaxIdNormalizer::normalize((string) sanitize_text_field(wp_unslash($posted_data['tg_tax_id'] ?? ''))),
            strtoupper((string) sanitize_text_field(wp_unslash($posted_data['billing_country'] ?? '')))
        );

        return $this->validate($input, 'classic');
    }

    public function validate_store_api_payload($arg1, $arg2): ValidationResult
    {
        $payload = [];
        foreach ([$arg1, $arg2] as $arg) {
            if (is_object($arg) && method_exists($arg, 'get_data') && ! ($arg instanceof \WC_Order)) {
                $payload = (array) $arg->get_data();
                break;
            }
            if (is_object($arg) && method_exists($arg, 'get_params')) {
                $payload = (array) $arg->get_params();
            }
        }

        $raw = DataExtractor::extract($payload);
        $input = new TaxIdInput(
            (bool) ($raw['tg_is_company'] ?? false),
            TaxIdNormalizer::normalize((string) ($raw['tg_tax_id'] ?? '')),
            strtoupper((string) ($raw['billing_country'] ?? ''))
        );

        $result = $this->validate($input, 'store_api');
        if (! $result->ok && ! empty($raw['tg_company_inferred'])) {
            $result->message .= ' ' . __('If you are not a company, leave Tax ID empty.', 'taxid-guard-for-woocommerce');
        }

        return $result;
    }

    public function validate(TaxIdInput $input, string $context = 'runtime'): ValidationResult
    {
        if (get_option('tg_enable', 'yes') !== 'yes') {
            return new ValidationResult(true, '', 'TG_DISABLED', 'skipped', 'skipped');
        }

        $input = apply_filters('tg_taxid_guard_input', $input, $context);
        if (! $input instanceof TaxIdInput) {
            $input = new TaxIdInput(false, '', '');
        }

        $country = preg_match('/^[A-Z]{2}$/', $input->country) ? $input->country : '';
        $taxId = $input->taxId;
        $isCompany = $input->isCompany;

        $showTaxIdField = (string) get_option('tg_show_taxid_field', 'always');
        $showCompanyCheckbox = get_option('tg_show_company_checkbox', 'yes') === 'yes';

        if ($showTaxIdField === 'no') {
            $this->store_temp('', false, $country, 'field_hidden', false, 'skipped');
            $this->add_temp_meta('__tg_context', $context);
            $this->add_temp_meta('__tg_input', $input);
            $result = new ValidationResult(true, '', 'TG_FIELD_DISABLED', 'skipped', 'field_hidden');
            return apply_filters('tg_taxid_guard_validation_result', $result, $input, $context);
        }

        if ($showTaxIdField === 'company' && $showCompanyCheckbox && ! $isCompany && $taxId === '') {
            $this->store_temp('', false, $country, 'company_only_skipped', false, 'skipped');
            $this->add_temp_meta('__tg_context', $context);
            $this->add_temp_meta('__tg_input', $input);
            $result = new ValidationResult(true, '', 'TG_SKIPPED', 'skipped', 'company_only_skipped');
            return apply_filters('tg_taxid_guard_validation_result', $result, $input, $context);
        }

        $vatCountry = $this->country_to_vat_prefix($country);
        if ($taxId !== '' && $country !== 'ES' && $this->is_eu_country($vatCountry) && get_option('tg_vat_prefix_auto', 'no') === 'yes' && strpos($taxId, $vatCountry) !== 0 && ! preg_match('/^[A-Z]{2}/', $taxId)) {
            $taxId = $vatCountry . $taxId;
        }

        $required = $this->is_required($country, $isCompany);
        $required = (bool) apply_filters('tg_taxid_guard_should_require_taxid', $required, $input, $context);
        if ($required && $taxId === '') {
            $this->store_temp($taxId, $isCompany, $country, 'empty', true, 'invalid');
            $this->add_temp_meta('__tg_context', $context);
            $this->add_temp_meta('__tg_input', $input);
            $result = new ValidationResult(false, $this->required_message($country), 'TG_TAXID_REQUIRED', 'invalid', 'empty');
            return apply_filters('tg_taxid_guard_validation_result', $result, $input, $context);
        }

        if ($taxId === '') {
            $this->store_temp($taxId, $isCompany, $country, 'skipped', $required, 'skipped');
            $this->add_temp_meta('__tg_context', $context);
            $this->add_temp_meta('__tg_input', $input);
            $result = new ValidationResult(true, '', 'TG_SKIPPED', 'skipped', 'skipped');
            return apply_filters('tg_taxid_guard_validation_result', $result, $input, $context);
        }

        $validation = $this->validate_by_country($country, $taxId);
        $this->store_temp($taxId, $isCompany, $country, (string) $validation['method'], $required, (string) $validation['status']);
        $this->add_temp_meta('__tg_context', $context);
        $this->add_temp_meta('__tg_input', $input);

        $result = new ValidationResult(
            (bool) $validation['valid'],
            (string) ($validation['message'] ?? ''),
            (string) ($validation['code'] ?? strtoupper((string) $validation['method'])),
            (string) $validation['status'],
            (string) $validation['method']
        );

        return apply_filters('tg_taxid_guard_validation_result', $result, $input, $context);
    }

    public function apply_validation_result(ValidationResult $result, string $context): void
    {
        if ($result->ok) {
            return;
        }

        $block = get_option('tg_mode', 'validate') === 'validate';
        $this->add_error($result->message, $context, 'tg_tax_id', $block, $result->code);
    }

    protected function is_eu_country(string $country): bool
    {
        return TaxIdValidatorEU::is_eu_country($country);
    }

    protected function country_to_vat_prefix(string $country): string
    {
        return $country === 'GR' ? 'EL' : $country;
    }

    protected function normalise_string_array($value): array
    {
        $value = maybe_unserialize($value);
        if (is_string($value)) {
            $value = trim($value) === '' ? [] : preg_split('/\s*,\s*/', trim($value));
        }
        if (! is_array($value)) {
            $value = [];
        }
        return array_values(array_unique(array_filter(array_map('sanitize_text_field', $value))));
    }

    protected function validate_by_country(string $country, string $tax_id): array
    {
        if ($country === 'US') {
            $ok = (bool) preg_match('/^[0-9]{9}$/', $tax_id);
            return [
                'valid' => $ok,
                'method' => 'us_ein',
                'status' => $ok ? 'valid' : 'invalid',
                'code' => $ok ? 'TG_VALID' : 'TG_TAXID_INVALID_US',
                'message' => $ok ? '' : __('EIN must be 9 digits (example: 12-3456789). Do not enter an SSN.', 'taxid-guard-for-woocommerce'),
            ];
        }
        if ($country === 'ES' && get_option('tg_validate_es', 'yes') === 'yes') {
            $result = TaxIdValidatorES::validate($tax_id);
            if (($result['valid'] ?? false) !== true) {
                $result['code'] = 'TG_TAXID_INVALID_ES';
            }
            return $result;
        }

        $vat = $this->country_to_vat_prefix($country);
        if ($country !== 'ES' && TaxIdValidatorEU::is_eu_country($vat) && get_option('tg_validate_eu_vat', 'yes') === 'yes') {
            $result = TaxIdValidatorEU::validate($vat, $tax_id);
            if (($result['valid'] ?? false) !== true) {
                $result['code'] = 'TG_TAXID_INVALID_EU_PATTERN';
            }
            return $result;
        }
        $ok = (bool) preg_match('/^[A-Z0-9]{4,24}$/', $tax_id);
        return [
            'valid' => $ok,
            'method' => 'basic_format',
            'status' => $ok ? 'valid' : 'invalid',
            'code' => $ok ? 'TG_VALID' : 'TG_TAXID_INVALID_FORMAT',
            'message' => $ok ? '' : __('The tax identifier format is invalid (must be 4-24 uppercase alphanumeric characters).', 'taxid-guard-for-woocommerce'),
        ];
    }

    protected function add_error(string $message, string $context, string $field_key, bool $block, string $error_code = 'TG_VALIDATION_ERROR'): void
    {
        $mode = (string) get_option('tg_mode', 'validate');
        if ($mode === 'collect') {
            $collectMessage = sprintf(
                /* translators: %s validation message */
                __('Tax ID was collected but not blocked: %s', 'taxid-guard-for-woocommerce'),
                $message
            );
            if ($context === 'store_api') {
                if ($this->logger) {
                    $this->logger->info('Collect-mode notice', ['field' => $field_key, 'code' => $error_code]);
                }
                return;
            }
            wc_add_notice($collectMessage, 'notice');
            return;
        }

        if ($context === 'store_api') {
            if ($block) {
                $exception = new WC_REST_Exception(strtolower($error_code), $message, 400);
                $exception->set_data(['field' => $field_key, 'code' => $error_code]);
                throw $exception;
            }
            return;
        }

        wc_add_notice($message, $block ? 'error' : 'notice');
    }

    protected function is_required(string $country, bool $is_company): bool
    {
        $required_countries = $this->normalise_string_array(get_option('tg_required_countries', []));
        $required = in_array($country, $required_countries, true) || ($is_company && get_option('tg_company_requires_taxid', 'yes') === 'yes');
        return (bool) $required;
    }

    protected function store_temp(string $tax_id, bool $is_company, string $country, string $method, bool $required, string $status): void
    {
        if (! $is_company && $tax_id === '') {
            $this->temp[0] = [
                'tax_id' => '',
                'is_company' => false,
                'country' => $country,
                'method' => 'not_company',
                'required' => $required,
                'status' => 'skipped',
            ];
            return;
        }

        $this->temp[0] = compact('tax_id', 'is_company', 'country', 'method', 'required', 'status');
    }

    protected function add_temp_meta($meta_key, $value = null): void
    {
        if (! isset($this->temp[0])) {
            $this->temp[0] = [];
        }
        if (is_array($meta_key)) {
            foreach ($meta_key as $key => $meta_value) {
                $this->temp[0][$key] = $meta_value;
            }
            return;
        }
        $this->temp[0][(string) $meta_key] = $value;
    }

    public function save_meta_classic($order): void
    {
        $this->save_meta($order);
    }

    public function save_meta_store_api($arg1, $arg2): void
    {
        $order = $arg1 instanceof \WC_Order ? $arg1 : ($arg2 instanceof \WC_Order ? $arg2 : null);
        if ($order instanceof \WC_Order) {
            $this->save_meta($order);
        }
    }

    private function save_meta(\WC_Order $order): void
    {
        if (empty($this->temp[0])) {
            return;
        }
        $meta = $this->temp[0];
        $order->update_meta_data('_tg_tax_id', $meta['tax_id'] ?? '');
        $order->update_meta_data('_tg_is_company', ! empty($meta['is_company']) ? 'yes' : 'no');
        $order->update_meta_data('_tg_tax_id_country', $meta['country'] ?? '');
        $order->update_meta_data('_tg_tax_id_validation', $meta['method'] ?? 'unknown');
        $order->update_meta_data('_tg_tax_id_status', $meta['status'] ?? 'skipped');
        $order->update_meta_data('_tg_tax_id_normalized_at', current_time('timestamp'));

        foreach ($meta as $key => $value) {
            if (is_string($key) && strpos($key, '_tg_') === 0 && ! in_array($key, ['_tg_tax_id', '_tg_is_company', '_tg_tax_id_country', '_tg_tax_id_validation', '_tg_tax_id_status', '_tg_tax_id_normalized_at'], true)) {
                $order->update_meta_data($key, $value);
            }
        }

        if ($order->get_user_id() && get_option('tg_save_taxid_profile', 'no') === 'yes') {
            if (! empty($meta['is_company'])) {
                update_user_meta($order->get_user_id(), '_tg_tax_id', (string) ($meta['tax_id'] ?? ''));
                update_user_meta($order->get_user_id(), '_tg_is_company', 'yes');
            } else {
                delete_user_meta($order->get_user_id(), '_tg_tax_id');
                update_user_meta($order->get_user_id(), '_tg_is_company', 'no');
            }
        }

        $context = isset($meta['__tg_context']) ? (string) $meta['__tg_context'] : 'runtime';
        $input = $meta['__tg_input'] instanceof TaxIdInput ? $meta['__tg_input'] : new TaxIdInput(! empty($meta['is_company']), (string) ($meta['tax_id'] ?? ''), (string) ($meta['country'] ?? ''));
        do_action('tg_taxid_guard_after_save_meta', $order->get_id(), $input, $context);

        $this->temp = [];
    }

    private function required_message(string $country): string
    {
        if ($country === 'US') {
            return __('Please enter your business EIN (9 digits).', 'taxid-guard-for-woocommerce');
        }
        if ($country === 'ES') {
            return __('Please enter your NIF/CIF/NIE.', 'taxid-guard-for-woocommerce');
        }
        if ($this->is_eu_country($this->country_to_vat_prefix($country))) {
            return __('Please enter your VAT number.', 'taxid-guard-for-woocommerce');
        }
        return __('Please enter your tax identifier.', 'taxid-guard-for-woocommerce');
    }
}
