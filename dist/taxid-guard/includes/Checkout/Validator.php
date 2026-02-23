<?php
declare(strict_types=1);

namespace TaxID_Guard\Checkout;

use TaxID_Guard\ValueObjects\TaxIdInput;
use TaxID_Guard\ValueObjects\ValidationResult;

defined('ABSPATH') || exit;

class Validator
{
    private ValidatorService $service;

    public function __construct(?ValidatorService $service = null)
    {
        $this->service = $service ?: new ValidatorService();

        add_action('woocommerce_checkout_process', [$this, 'validate_classic']);
        add_action('woocommerce_store_api_checkout_update_order_meta', [$this, 'validate_store_api'], 10, 2);
        add_action('woocommerce_checkout_create_order', [$this, 'save_meta_classic'], 10, 2);
        add_action('woocommerce_store_api_checkout_update_order_meta', [$this, 'save_meta_store_api'], 20, 2);
    }

    public function validate_classic(): void
    {
        $result = $this->service->validate_classic_post($_POST);
        $this->service->apply_validation_result($result, 'classic');
    }

    public function validate_store_api($arg1, $arg2): void
    {
        $result = $this->service->validate_store_api_payload($arg1, $arg2);
        $this->service->apply_validation_result($result, 'store_api');
    }

    public function validate(TaxIdInput $input, string $context = 'runtime'): ValidationResult
    {
        return $this->service->validate($input, $context);
    }

    public function save_meta_classic($order): void
    {
        $this->service->save_meta_classic($order);
    }

    public function save_meta_store_api($arg1, $arg2): void
    {
        $this->service->save_meta_store_api($arg1, $arg2);
    }
}
