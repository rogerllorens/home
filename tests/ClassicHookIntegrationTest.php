<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ClassicHookIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_actions'] = [];
        $GLOBALS['tg_filters'] = [];
        $GLOBALS['wc_notices'] = [];
        $GLOBALS['tg_test_options'] = [
            'tg_enable' => 'yes',
            'tg_show_taxid_field' => 'always',
            'tg_show_company_checkbox' => 'yes',
            'tg_mode' => 'validate',
            'tg_company_requires_taxid' => 'yes',
            'tg_validate_es' => 'yes',
            'tg_validate_eu_vat' => 'yes',
        ];
    }

    public function testClassicHookAddsHardErrorWhenInvalidInValidateMode(): void
    {
        $_POST = ['billing_country' => 'ES', 'tg_is_company' => '1', 'tg_tax_id' => '123'];

        new \TaxID_Guard\Checkout\Validator();
        do_action('woocommerce_checkout_process');

        $errors = array_values(array_filter($GLOBALS['wc_notices'], static fn($n) => $n['type'] === 'error'));
        $this->assertNotEmpty($errors);
    }

    public function testClassicHookCollectModeDoesNotHardBlock(): void
    {
        update_option('tg_mode', 'collect');
        $_POST = ['billing_country' => 'ES', 'tg_is_company' => '1', 'tg_tax_id' => '123'];

        new \TaxID_Guard\Checkout\Validator();
        do_action('woocommerce_checkout_process');

        $errors = array_values(array_filter($GLOBALS['wc_notices'], static fn($n) => $n['type'] === 'error'));
        $notices = array_values(array_filter($GLOBALS['wc_notices'], static fn($n) => $n['type'] === 'notice'));
        $this->assertEmpty($errors);
        $this->assertNotEmpty($notices);
    }

    public function testClassicHookSkipsWhenFieldHidden(): void
    {
        update_option('tg_show_taxid_field', 'no');
        $_POST = ['billing_country' => 'ES', 'tg_is_company' => '1', 'tg_tax_id' => '123'];

        new \TaxID_Guard\Checkout\Validator();
        do_action('woocommerce_checkout_process');

        $this->assertEmpty($GLOBALS['wc_notices']);
    }
}
