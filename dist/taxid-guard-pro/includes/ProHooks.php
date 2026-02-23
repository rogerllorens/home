<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro;

use TaxID_Guard\ValueObjects\TaxIdInput;
use TaxID_Guard\ValueObjects\ValidationResult;
use TaxID_Guard_Pro\Admin\ProAdminPages;
use TaxID_Guard_Pro\Pro\ViesService;

final class ProHooks
{
    public function register(): void
    {
        add_filter('tg_taxid_guard_should_require_taxid', [$this, 'should_require'], 10, 3);
        add_filter('tg_taxid_guard_validation_result', [$this, 'validate_with_vies'], 20, 3);
        add_filter('tg_taxid_guard_settings_sections', [$this, 'settings_section']);
        add_filter('woocommerce_available_payment_gateways', [$this, 'gate_payment_methods'], 20);
        add_filter('woocommerce_package_rates', [$this, 'gate_shipping_methods'], 20, 2);
        add_filter('woocommerce_customer_is_vat_exempt', [$this, 'preserve_vat_exemption_rules'], 30, 2);
        add_action('tg_taxid_guard_after_save_meta', [$this, 'save_order_meta'], 10, 3);
        add_action('woocommerce_checkout_create_order', [$this, 'write_invoice_meta'], 40, 2);
        add_filter('wpo_wcpdf_billing_address', [$this, 'append_vat_to_pdf_billing_address'], 10, 2);

        (new ProAdminPages())->register();
    }

    public function should_require(bool $required, TaxIdInput $input, string $context): bool
    {
        if ($this->is_excluded_by_payment() || $this->is_excluded_by_shipping() || $this->is_excluded_virtual_order()) {
            return false;
        }

        $roles = $this->option_list('tg_required_roles');
        $user = wp_get_current_user();
        if ($roles && array_intersect($roles, (array) $user->roles)) {
            $required = true;
        }

        $countries = $this->option_list('tg_required_countries_pro');
        if ($countries && in_array(strtoupper($input->country), array_map('strtoupper', $countries), true)) {
            $required = true;
        }

        $min = (float) get_option('tg_cart_total_threshold', 0);
        if ($min > 0 && function_exists('WC') && WC()->cart && (float) WC()->cart->total >= $min) {
            $required = true;
        }

        if (get_option('tg_pro_require_company_name', 'no') === 'yes' && $input->isCompany && ! $this->has_company_name_from_request()) {
            $required = true;
        }

        return (bool) apply_filters('tg_pro_should_require_vat', $required, $input, $context);
    }

    public function validate_with_vies(ValidationResult $result, TaxIdInput $input, string $context): ValidationResult
    {
        $result = $this->enforce_company_name($result, $input);
        $result = $this->enforce_ip_country_match($result, $input);

        if (! $result->ok || ! $input->isCompany || $input->taxId === '' || get_option('tg_pro_vies', 'no') !== 'yes') {
            $this->persist_session_status($result, $input, 'local');
            return $result;
        }

        $viesService = new ViesService();
        $vies = $viesService->check($input->country, $input->taxId);

        if ($vies['valid'] === true) {
            $ok = new ValidationResult(true, $result->message, 'TG_VALID', 'valid', 'vies_valid');
            $this->persist_session_status($ok, $input, (string) ($vies['source'] ?? 'vies'));
            return $ok;
        }

        if ($vies['valid'] === false) {
            $invalid = new ValidationResult(false, __('The VAT number is invalid according to VIES.', 'taxid-guard-pro'), 'TG_VIES_INVALID', 'invalid', 'vies_invalid');
            $this->persist_session_status($invalid, $input, (string) ($vies['source'] ?? 'vies'));
            return $invalid;
        }

        if (get_option('tg_vies_fail_mode', 'block') === 'allow') {
            $this->persist_session_status($result, $input, 'vies_unavailable_allowed');
            return $result;
        }

        $message = $viesService->is_circuit_breaker_open()
            ? __('VIES is temporarily unavailable due to repeated failures. Please try later.', 'taxid-guard-pro')
            : __('VIES is unavailable right now. Please try later.', 'taxid-guard-pro');

        $blocked = new ValidationResult(false, $message, 'TG_VIES_UNAVAILABLE_BLOCKED', 'unverified', 'vies_error');
        $this->persist_session_status($blocked, $input, (string) ($vies['source'] ?? 'vies_error'));
        return $blocked;
    }

    public function gate_payment_methods(array $gateways): array
    {
        if (get_option('tg_gate_payment_methods_when_vat_invalid', 'no') !== 'yes') {
            return $gateways;
        }

        $status = $this->get_session_status();
        $allow = $status === 'valid'
            ? $this->option_list('tg_allowed_payment_methods_if_vat_valid')
            : $this->option_list('tg_allowed_payment_methods_if_vat_invalid');

        if ($allow === []) {
            return $gateways;
        }

        foreach (array_keys($gateways) as $gatewayId) {
            if (!in_array((string) $gatewayId, $allow, true)) {
                unset($gateways[$gatewayId]);
            }
        }

        return $gateways;
    }

    public function gate_shipping_methods(array $rates, array $package): array
    {
        if (get_option('tg_gate_shipping_methods_when_vat_invalid', 'no') !== 'yes') {
            return $rates;
        }

        $status = $this->get_session_status();
        $allow = $status === 'valid'
            ? $this->option_list('tg_allowed_shipping_methods_if_vat_valid')
            : $this->option_list('tg_allowed_shipping_methods_if_vat_invalid');

        if ($allow === []) {
            return $rates;
        }

        foreach ($rates as $rateId => $rate) {
            $methodId = (string) ($rate->method_id ?? '');
            if ($methodId !== '' && !in_array($methodId, $allow, true)) {
                unset($rates[$rateId]);
            }
        }

        return $rates;
    }

    public function preserve_vat_exemption_rules(bool $isExempt, $customer): bool
    {
        if (!$isExempt) {
            return false;
        }

        if (get_option('tg_pro_exempt_requires_vies', 'yes') === 'yes' && $this->get_session_status() !== 'valid') {
            return false;
        }

        $preserveCountries = $this->option_list('tg_preserve_vat_countries');
        $billingCountry = '';
        if (function_exists('WC') && WC()->customer && method_exists(WC()->customer, 'get_billing_country')) {
            $billingCountry = strtoupper((string) WC()->customer->get_billing_country());
        }

        if ($preserveCountries && in_array($billingCountry, array_map('strtoupper', $preserveCountries), true)) {
            return false;
        }

        if (get_option('tg_preserve_vat_when_shipping_differs', 'no') === 'yes' && function_exists('WC') && WC()->customer) {
            $shipping = strtoupper((string) WC()->customer->get_shipping_country());
            if ($shipping !== '' && $billingCountry !== '' && $shipping !== $billingCountry) {
                return false;
            }
        }

        return true;
    }

    public function save_order_meta(int $orderId, TaxIdInput $input, string $context): void
    {
        if (!function_exists('WC') || !WC()->session || !function_exists('wc_get_order')) {
            return;
        }
        $order = wc_get_order($orderId);
        if (!$order instanceof \WC_Order) {
            return;
        }

        $session = WC()->session->get('tg_pro_vat_state');
        if (is_array($session)) {
            $order->update_meta_data('_tg_vies_status', (string) ($session['status'] ?? 'unverified'));
            $order->update_meta_data('_tg_vies_source', (string) ($session['source'] ?? 'local'));
            $order->update_meta_data('_tg_vies_checked_at', gmdate('c'));
        }

        $ipState = WC()->session->get('tg_pro_ip_match');
        if (is_array($ipState)) {
            $order->update_meta_data('_tg_ip_country', (string) ($ipState['ip_country'] ?? ''));
            $order->update_meta_data('_tg_ip_country_match', (string) ($ipState['match'] ?? 'unknown'));
        }
    }

    public function write_invoice_meta($order): void
    {
        if (! $order instanceof \WC_Order) {
            return;
        }

        $vat = (string) $order->get_meta('_billing_tax_id');
        if ($vat === '') {
            return;
        }

        $order->update_meta_data('_billing_vat_number', $vat);
        $order->update_meta_data('_billing_eu_vat_number', $vat);
    }

    public function append_vat_to_pdf_billing_address(string $address, \WC_Order $order): string
    {
        if (get_option('tg_pdf_append_vat_to_billing_address', 'yes') !== 'yes') {
            return $address;
        }

        $vat = (string) $order->get_meta('_billing_tax_id');
        if ($vat === '') {
            return $address;
        }

        return $address . "\n" . sprintf(__('VAT: %s', 'taxid-guard-pro'), $vat);
    }

    public function settings_section(array $sections): array
    {
        $sections[] = static function (): void {
            $vies = new ViesService();
            echo '<h2>' . esc_html__('TaxID Guard Pro', 'taxid-guard-pro') . '</h2>';
            echo '<p class="description">' . esc_html__('Advanced VIES/rules features are active.', 'taxid-guard-pro') . '</p>';
            echo '<p class="description">' . esc_html__('VIES circuit breaker: ', 'taxid-guard-pro') . ($vies->is_circuit_breaker_open() ? esc_html__('Open', 'taxid-guard-pro') : esc_html__('Closed', 'taxid-guard-pro')) . '</p>';
            echo '<p><a href="' . esc_url(admin_url('admin.php?page=tg-pro-readiness')) . '">' . esc_html__('Open Pro readiness & reports', 'taxid-guard-pro') . '</a></p>';
        };

        return $sections;
    }

    private function enforce_company_name(ValidationResult $result, TaxIdInput $input): ValidationResult
    {
        if (!$result->ok) {
            return $result;
        }

        if (get_option('tg_pro_require_company_name', 'no') === 'yes' && $input->isCompany && ! $this->has_company_name_from_request()) {
            return new ValidationResult(false, __('Company name is required for B2B VAT validation.', 'taxid-guard-pro'), 'TG_COMPANY_REQUIRED', 'invalid', 'company_required');
        }

        return $result;
    }

    private function enforce_ip_country_match(ValidationResult $result, TaxIdInput $input): ValidationResult
    {
        if (!$result->ok || !$input->isCompany) {
            return $result;
        }

        $mode = (string) get_option('tg_require_ip_country_match', 'off');
        if ($mode === 'off') {
            return $result;
        }

        $ipCountry = $this->detect_ip_country();
        $billing = strtoupper((string) $input->country);
        if ($ipCountry === '' || $ipCountry === 'UNKNOWN') {
            return $result;
        }

        $matches = $billing !== '' && $billing === $ipCountry;
        if (function_exists('WC') && WC()->session) {
            WC()->session->set('tg_pro_ip_match', ['ip_country' => $ipCountry, 'match' => $matches ? 'yes' : 'no']);
        }

        if ($matches || $mode === 'warn') {
            return $result;
        }

        return new ValidationResult(false, __('IP country does not match billing country for this VAT number.', 'taxid-guard-pro'), 'TG_IP_COUNTRY_MISMATCH', 'invalid', 'ip_mismatch');
    }

    private function detect_ip_country(): string
    {
        if (class_exists('WC_Geolocation') && method_exists('WC_Geolocation', 'geolocate_ip')) {
            $geo = \WC_Geolocation::geolocate_ip();
            if (is_array($geo) && !empty($geo['country'])) {
                return strtoupper((string) $geo['country']);
            }
        }

        return 'UNKNOWN';
    }

    private function persist_session_status(ValidationResult $result, TaxIdInput $input, string $source): void
    {
        if (!function_exists('WC') || !WC()->session) {
            return;
        }

        WC()->session->set('tg_pro_vat_state', [
            'status' => $result->ok ? 'valid' : (($result->status ?: 'unverified')),
            'source' => $source,
            'country' => strtoupper((string) $input->country),
            'tax_id' => (string) $input->taxId,
        ]);
    }

    private function get_session_status(): string
    {
        if (!function_exists('WC') || !WC()->session) {
            return 'unverified';
        }

        $state = WC()->session->get('tg_pro_vat_state');
        if (!is_array($state)) {
            return 'unverified';
        }

        return (string) ($state['status'] ?? 'unverified');
    }


    private function has_company_name_from_request(): bool
    {
        $company = sanitize_text_field((string) ($_POST['billing_company'] ?? $_POST['company'] ?? ''));
        return $company !== '';
    }

    private function option_list(string $key): array
    {
        $value = get_option($key, []);
        if (is_string($value)) {
            $value = trim($value) === '' ? [] : preg_split('/\s*,\s*/', $value);
        }
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(static fn($v) => sanitize_text_field((string) $v), $value)));
    }

    private function is_excluded_by_payment(): bool
    {
        $excluded = $this->option_list('tg_exclude_payment_methods');
        if ($excluded === [] || ! function_exists('WC') || ! WC()->session) {
            return false;
        }

        $chosen = (string) WC()->session->get('chosen_payment_method');
        return $chosen !== '' && in_array($chosen, $excluded, true);
    }

    private function is_excluded_by_shipping(): bool
    {
        $excluded = $this->option_list('tg_exclude_shipping_methods');
        if ($excluded === [] || ! function_exists('WC') || ! WC()->session) {
            return false;
        }

        $chosen = WC()->session->get('chosen_shipping_methods');
        if (! is_array($chosen)) {
            return false;
        }

        foreach ($chosen as $methodId) {
            if (in_array((string) $methodId, $excluded, true)) {
                return true;
            }
        }

        return false;
    }

    private function is_excluded_virtual_order(): bool
    {
        if (get_option('tg_exclude_virtual_orders', 'no') !== 'yes') {
            return false;
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
            if ($product && method_exists($product, 'is_virtual') && ! $product->is_virtual()) {
                return false;
            }
        }

        return true;
    }
}
