<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class VatExemptionManagerTest extends TestCase
{
    /** @dataProvider provideModes */
    public function testShouldApplyExemption(string $mode, string $base, string $billing, bool $isCompany, bool $isValid, bool $collect, bool $expected): void
    {
        $result = \TaxID_Guard\Checkout\VatExemptionManager::should_apply_exemption($mode, $base, $billing, $isCompany, $isValid, $collect);
        $this->assertSame($expected, $result['apply']);
    }

    public static function provideModes(): array
    {
        return [
            ['off', 'ES', 'DE', true, true, false, false],
            ['exempt_when_valid_outside_base_country', 'ES', 'DE', true, true, false, true],
            ['exempt_when_valid_outside_base_country', 'ES', 'ES', true, true, false, false],
            ['exempt_when_valid_anywhere', 'ES', 'ES', true, true, false, true],
            ['preserve_vat_in_base_country_only', 'ES', 'DE', true, true, false, true],
            ['preserve_vat_in_base_country_only', 'ES', 'ES', true, true, false, false],
            ['exempt_when_valid_anywhere', 'ES', 'DE', false, true, false, false],
            ['exempt_when_valid_anywhere', 'ES', 'DE', true, false, false, false],
            ['exempt_when_valid_anywhere', 'ES', 'DE', true, true, true, false],
        ];
    }
}
