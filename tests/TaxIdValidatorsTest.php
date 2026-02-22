<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Domain\TaxIdNormalizer;
use TaxID_Guard\Domain\TaxIdValidatorES;
use TaxID_Guard\Domain\TaxIdValidatorEU;

final class TaxIdValidatorsTest extends TestCase
{
    public function testNormalizer(): void
    {
        $this->assertSame('ESB12345678', TaxIdNormalizer::normalize(' es-b.12345678\n'));
    }

    public function testEsValidatorReturnsArrayContract(): void
    {
        $r = TaxIdValidatorES::validate('12345678Z');
        $this->assertIsArray($r);
        $this->assertArrayHasKey('valid', $r);
    }

    public function testEuValidatorReturnsArrayContract(): void
    {
        $r = TaxIdValidatorEU::validate('DE', 'DE123456789');
        $this->assertIsArray($r);
        $this->assertArrayHasKey('valid', $r);
    }
}
