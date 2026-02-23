<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class StoreApiHookIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_actions'] = [];
        $GLOBALS['tg_filters'] = [];
        $GLOBALS['wc_notices'] = [];
        $GLOBALS['tg_test_options'] = [
            'tg_enable' => 'yes',
            'tg_mode' => 'validate',
            'tg_show_taxid_field' => 'company',
            'tg_show_company_checkbox' => 'yes',
            'tg_company_requires_taxid' => 'yes',
            'tg_validate_es' => 'yes',
            'tg_validate_eu_vat' => 'yes',
        ];

        $GLOBALS['wc_stub'] = (object) ['customer' => new class {
            public function get_billing_country(): string { return 'DE'; }
            public function get_shipping_country(): string { return 'DE'; }
        }];
    }

    public function testStoreApiHookThrowsRestExceptionForInvalidTaxId(): void
    {
        new \TaxID_Guard\Checkout\Validator();

        $request = new class {
            public function get_data(): array {
                return [
                    'additional_fields' => [
                        'taxid-guard/tg_is_company' => 'true',
                        'taxid-guard/tg_tax_id' => 'XYZ',
                    ],
                ];
            }
        };

        $this->expectException(\WC_REST_Exception::class);
        do_action('woocommerce_store_api_checkout_update_order_meta', $request, null);
    }

    public function testStoreApiUsesExtractorAndAppendsCompanyHintWhenInferred(): void
    {
        new \TaxID_Guard\Checkout\Validator();

        $request = new class {
            public function get_data(): array {
                return [
                    'additional_fields' => [
                        ['key' => 'taxid-guard/tg_tax_id', 'value' => 'XYZ'],
                    ],
                ];
            }
        };

        try {
            do_action('woocommerce_store_api_checkout_update_order_meta', $request, null);
            $this->fail('Expected exception not thrown');
        } catch (\WC_REST_Exception $e) {
            $this->assertStringContainsString('If you are not a company, leave Tax ID empty.', $e->getMessage());
        }
    }

    public function testCompanyOnlyWithoutTaxIdDefaultsToNonCompanyAndNoException(): void
    {
        new \TaxID_Guard\Checkout\Validator();

        $request = new class {
            public function get_data(): array {
                return [
                    'additional_fields' => [],
                ];
            }
        };

        do_action('woocommerce_store_api_checkout_update_order_meta', $request, null);
        $this->assertTrue(true);
    }
}
