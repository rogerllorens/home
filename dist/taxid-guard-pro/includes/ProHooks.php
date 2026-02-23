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
        $roles = (array) get_option('tg_required_roles', []);
        $user = wp_get_current_user();
        if ($roles && array_intersect($roles, (array) $user->roles)) {
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
        if (!$result->ok || !$input->isCompany || $input->taxId === '' || get_option('tg_pro_vies', 'no') !== 'yes') {
            return $result;
        }

        $vies = (new ViesService())->check($input->country, $input->taxId);
        if ($vies['valid'] === true) {
            return $result;
        }

        if ($vies['valid'] === false) {
            return new ValidationResult(false, __('The VAT number is invalid according to VIES.', 'taxid-guard-pro'), 'TG_VIES_INVALID', 'invalid', 'vies_invalid');
        }

        if (get_option('tg_vies_fail_mode', 'block') === 'allow') {
            return $result;
        }

        return new ValidationResult(false, __('VIES is unavailable right now. Please try later.', 'taxid-guard-pro'), 'TG_VIES_UNAVAILABLE_BLOCKED', 'unverified', 'vies_error');
    }

    public function settings_section(array $sections): array
    {
        $sections[] = static function (): void {
            echo '<h2>' . esc_html__('TaxID Guard Pro', 'taxid-guard-pro') . '</h2>';
            echo '<p class="description">' . esc_html__('VIES validation and advanced B2B rules are active.', 'taxid-guard-pro') . '</p>';
        };
        return $sections;
    }
}
