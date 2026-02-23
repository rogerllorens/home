<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ConfigMatrixTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_actions'] = [];
        $GLOBALS['tg_filters'] = [];
        $GLOBALS['wc_notices'] = [];
        $GLOBALS['tg_test_options'] = [
            'tg_enable' => 'yes',
            'tg_validate_es' => 'yes',
            'tg_validate_eu_vat' => 'yes',
            'tg_vat_prefix_auto' => 'no',
        ];
    }

    /** @dataProvider provideMatrixCases */
    public function testConfigMatrixBehavior(array $cfg): void
    {
        foreach ($cfg['options'] as $k => $v) {
            update_option($k, $v);
        }

        $_POST = [
            'billing_country' => $cfg['country'],
            'tg_tax_id' => $cfg['tax_id'],
        ];
        if ($cfg['is_company'] !== null) {
            $_POST['tg_is_company'] = $cfg['is_company'] ? '1' : '0';
        }

        new \TaxID_Guard\Checkout\Validator();
        do_action('woocommerce_checkout_process');

        $hardErrors = array_values(array_filter($GLOBALS['wc_notices'], static fn($n) => $n['type'] === 'error'));
        $softNotices = array_values(array_filter($GLOBALS['wc_notices'], static fn($n) => $n['type'] === 'notice'));

        if ($cfg['expect_hard_block']) {
            $this->assertNotEmpty($hardErrors, $cfg['name']);
        } else {
            $this->assertEmpty($hardErrors, $cfg['name']);
        }

        if (($cfg['options']['tg_mode'] ?? 'validate') === 'collect' && $cfg['expect_invalid']) {
            $this->assertNotEmpty($softNotices, $cfg['name']);
        }

        $validator = new \TaxID_Guard\Checkout\Validator();
        $input = new \TaxID_Guard\ValueObjects\TaxIdInput((bool) $cfg['is_company'], (string) $cfg['tax_id'], (string) $cfg['country']);
        $result = $validator->validate($input, 'test_matrix');
        if ($cfg['expected_code'] !== null) {
            $this->assertSame($cfg['expected_code'], $result->code, $cfg['name']);
        }
    }

    public static function provideMatrixCases(): array
    {
        $cases = [];
        $modes = ['validate', 'collect'];
        $fields = ['no', 'company', 'always'];
        $checkboxes = ['yes', 'no'];
        $requireds = ['yes', 'no'];

        $i = 0;
        foreach ($modes as $mode) {
            foreach ($fields as $field) {
                foreach ($checkboxes as $showCompany) {
                    foreach ($requireds as $required) {
                        $country = $i % 2 === 0 ? 'ES' : 'DE';
                        $isCompany = $i % 3 === 0 ? true : false;
                        $taxId = $i % 4 === 0 ? '' : ($country === 'ES' ? ($i % 5 === 0 ? '12345678Z' : '123') : ($i % 5 === 0 ? 'DE123456789' : 'XYZ'));

                        $expectInvalid = $field !== 'no' && (($required === 'yes' && $isCompany && $taxId === '') || ($taxId !== '' && (($country === 'ES' && $taxId !== '12345678Z') || ($country === 'DE' && $taxId !== 'DE123456789'))));
                        $expectHard = $mode === 'validate' && $expectInvalid;
                        $expectedCode = null;
                        if ($field === 'no') {
                            $expectedCode = 'TG_FIELD_DISABLED';
                        } elseif ($required === 'yes' && $isCompany && $taxId === '') {
                            $expectedCode = 'TG_TAXID_REQUIRED';
                        } elseif ($taxId !== '' && $country === 'ES' && $taxId !== '12345678Z') {
                            $expectedCode = 'TG_TAXID_INVALID_ES';
                        } elseif ($taxId !== '' && $country === 'DE' && $taxId !== 'DE123456789') {
                            $expectedCode = 'TG_TAXID_INVALID_EU_PATTERN';
                        }

                        $cases[] = [
                            'name' => "case_{$i}",
                            'options' => [
                                'tg_mode' => $mode,
                                'tg_show_taxid_field' => $field,
                                'tg_show_company_checkbox' => $showCompany,
                                'tg_company_requires_taxid' => $required,
                            ],
                            'country' => $country,
                            'is_company' => $isCompany,
                            'tax_id' => $taxId,
                            'expect_invalid' => $expectInvalid,
                            'expect_hard_block' => $expectHard,
                            'expected_code' => $expectedCode,
                        ];
                        $i++;
                        if ($i >= 24) {
                            return $cases;
                        }
                    }
                }
            }
        }

        return $cases;
    }
}
