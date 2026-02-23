<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ValidatorPipelineTest extends TestCase
{
    public function testCompanyOnlyModeWithMissingCompanyFlagAndTaxIdAssumesCompany(): void
    {
        update_option('tg_show_taxid_field', 'company');

        $payload = [
            'billing_address' => ['country' => 'DE'],
            'additional_fields' => [
                'taxid-guard/tg_tax_id' => 'DE123456789',
            ],
        ];

        $data = \TaxID_Guard\Checkout\DataExtractor::extract($payload);

        $this->assertTrue($data['tg_is_company']);
        $this->assertSame('DE123456789', $data['tg_tax_id']);
    }

    public function testCompanyOnlyModeWithoutTaxIdDefaultsToNotCompany(): void
    {
        update_option('tg_show_taxid_field', 'company');

        $payload = [
            'billing_address' => ['country' => 'DE'],
            'additional_fields' => [],
        ];

        $data = \TaxID_Guard\Checkout\DataExtractor::extract($payload);

        $this->assertFalse($data['tg_is_company']);
        $this->assertSame('', $data['tg_tax_id']);
    }
}
