<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class LocationEvidenceTest extends TestCase
{
    /** @dataProvider provideEvidence */
    public function testComputeConflict(string $billing, string $shipping, string $ip, bool $expected): void
    {
        $this->assertSame($expected, \TaxID_Guard\Checkout\LocationEvidence::compute_conflict($billing, $shipping, $ip));
    }

    public static function provideEvidence(): array
    {
        return [
            ['DE', 'DE', 'DE', false],
            ['DE', 'FR', 'FR', false],
            ['DE', 'FR', 'IT', true],
            ['DE', '', 'unknown', false],
        ];
    }
}
