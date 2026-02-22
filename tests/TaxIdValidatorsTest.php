<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Domain\TaxIdNormalizer;
use TaxID_Guard\Domain\TaxIdValidatorES;
use TaxID_Guard\Domain\TaxIdValidatorEU;

final class TaxIdValidatorsTest extends TestCase
{
    /** @dataProvider provideNormalizerCases */
    public function testNormalizer(string $input, string $expected): void
    {
        $this->assertSame($expected, TaxIdNormalizer::normalize($input));
    }

    public static function provideNormalizerCases(): array
    {
        return [
            [' es-b.12345678\n', 'ESB12345678'],
            ['  x-1234567 t ', 'X1234567T'],
            ['de 123 456 789', 'DE123456789'],
            ['@@invalid--##', 'INVALID'],
        ];
    }

    /** @dataProvider provideValidSpanishTaxIds */
    public function testSpanishValidatorAcceptsValidValues(string $taxId): void
    {
        $result = TaxIdValidatorES::validate($taxId);
        $this->assertTrue($result['valid'], $taxId);
    }

    public static function provideValidSpanishTaxIds(): array
    {
        return [
            ['12345678Z'], // NIF
            ['X1234567L'], // NIE
            ['B12345674'], // CIF digit control
            ['P2345678H'], // CIF letter control
        ];
    }

    /** @dataProvider provideInvalidSpanishTaxIds */
    public function testSpanishValidatorRejectsInvalidValues(string $taxId): void
    {
        $result = TaxIdValidatorES::validate($taxId);
        $this->assertFalse($result['valid'], $taxId);
    }

    public static function provideInvalidSpanishTaxIds(): array
    {
        return [
            ['12345678A'],
            ['X1234567A'],
            ['B12345670'],
            ['ESB12345674'],
            ['12-345-678Z'],
        ];
    }

    /** @dataProvider provideEuVatPatternCases */
    public function testEuVatPatternValidation(string $country, string $taxId, bool $expectedValid): void
    {
        $result = TaxIdValidatorEU::validate($country, $taxId);
        $this->assertSame($expectedValid, (bool) $result['valid']);
    }

    public static function provideEuVatPatternCases(): array
    {
        return [
            ['DE', 'DE123456789', true],
            ['FR', 'FRAB123456789', true],
            ['IT', 'IT12345678901', true],
            ['NL', 'NL123456789B01', true],
            ['PL', 'PL1234567890', true],
            ['BE', 'BE0123456789', true],
            ['DE', '123456789', false],
            ['IT', 'IT123', false],
            ['NL', 'NL123456789C01', false],
        ];
    }
}
