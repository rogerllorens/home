<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro;

use TaxID_Guard\ValueObjects\TaxIdInput;
use TaxID_Guard\ValueObjects\ValidationResult;
use TaxID_Guard_Pro\Pro\ViesService;

final class ProHooks
{
    public function register(): void
    {
        add_filter('tg_taxid_guard_should_require_taxid', [$this, 'should_require'], 10, 3);
        add_filter('tg_taxid_guard_validation_result', [$this, 'validate_with_vies'], 10, 3);
        add_filter('tg_taxid_guard_settings_sections', [$this, 'settings_section']);
    }

    public function should_require(bool $required, TaxIdInput $input, string $context): bool
    {
        if ($this->is_excluded_by_payment()) {
            return false;
        }

        if ($this->is_excluded_by_shipping()) {
            return false;
        }

        if ($this->is_excluded_virtual_order()) {
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

        return $required;
    }

    public function validate_with_vies(ValidationResult $result, TaxIdInput $input, string $context): ValidationResult
    {
        if (! $result->ok || ! $input->isCompany || $input->taxId === '' || get_option('tg_pro_vies', 'no') !== 'yes') {
            return $result;
        }

        $viesService = new ViesService();
        $vies = $viesService->check($input->country, $input->taxId);
        if ($vies['valid'] === true) {
            return $result;
        }

        if ($vies['valid'] === false) {
            return new ValidationResult(false, __('The VAT number is invalid according to VIES.', 'taxid-guard-pro'), 'TG_VIES_INVALID', 'invalid', 'vies_invalid');
        }

        if (get_option('tg_vies_fail_mode', 'block') === 'allow') {
            return $result;
        }

        $message = $viesService->is_circuit_breaker_open()
            ? __('VIES is temporarily unavailable due to repeated failures. Please try later.', 'taxid-guard-pro')
            : __('VIES is unavailable right now. Please try later.', 'taxid-guard-pro');

        return new ValidationResult(false, $message, 'TG_VIES_UNAVAILABLE_BLOCKED', 'unverified', 'vies_error');
    }

    public function settings_section(array $sections): array
    {
        $sections[] = static function (): void {
            $vies = new ViesService();
            echo '<h2>' . esc_html__('TaxID Guard Pro', 'taxid-guard-pro') . '</h2>';
            echo '<p class="description">' . esc_html__('VIES validation and advanced B2B rules are active.', 'taxid-guard-pro') . '</p>';
            echo '<p class="description">' . esc_html__('VIES circuit breaker: ', 'taxid-guard-pro') . ($vies->is_circuit_breaker_open() ? esc_html__('Open', 'taxid-guard-pro') : esc_html__('Closed', 'taxid-guard-pro')) . '</p>';
        };
        return $sections;
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
