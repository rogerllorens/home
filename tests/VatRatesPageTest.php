<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class VatRatesPageTest extends TestCase
{
    public function testMergeRatesDoesNotDuplicateExisting(): void
    {
        $existing = ['DE' => 19.0, 'ES' => 21.0];
        $incoming = ['DE' => 19.0, 'FR' => 20.0];

        $result = \TaxID_Guard\Admin\VatRatesPage::merge_rates($existing, $incoming);

        $this->assertSame(['DE' => 19.0, 'ES' => 21.0, 'FR' => 20.0], $result);
    }
}
