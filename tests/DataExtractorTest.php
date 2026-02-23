<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Checkout\DataExtractor;

final class DataExtractorTest extends TestCase
{
    protected function setUp(): void
    {
        if (!function_exists('WC')) {
            function WC() {
                return $GLOBALS['wc_stub'];
            }
        }

        $customer = new class {
            public function get_billing_country(): string { return 'PT'; }
            public function get_shipping_country(): string { return 'ES'; }
        };

        $GLOBALS['wc_stub'] = (object) ['customer' => $customer];
    }

    public function testExtractsFromAdditionalFieldsAssoc(): void
    {
        $payload = [
            'additional_fields' => [
                'taxid-guard/tg_is_company' => 'true',
                'taxid-guard/tg_tax_id' => 'es-b12345678',
            ],
        ];

        $data = DataExtractor::extract($payload);

        $this->assertTrue($data['tg_is_company']);
        $this->assertSame('es-b12345678', $data['tg_tax_id']);
        $this->assertSame('PT', $data['billing_country']);
    }

    public function testExtractsFromAdditionalFieldsListObjects(): void
    {
        $payload = [
            'billing_address' => ['country' => 'de'],
            'additional_fields' => [
                ['key' => 'tg_is_company', 'value' => '1'],
                ['name' => 'tg_tax_id', 'value' => 'DE123456789'],
            ],
        ];

        $data = DataExtractor::extract($payload);

        $this->assertTrue($data['tg_is_company']);
        $this->assertSame('DE123456789', $data['tg_tax_id']);
        $this->assertSame('DE', $data['billing_country']);
    }
}
