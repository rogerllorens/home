<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Pro\Vies\ViesService;

final class ViesServiceTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_test_transients'] = [];
    }

    public function testCircuitBreakerOpenReturnsDegradedResultWithoutSoapCall(): void
    {
        set_transient('tg_vies_circuit_open', 1, 600);

        $service = new ViesService();
        $result = $service->check('DE', '123456789');

        $this->assertNull($result['valid']);
        $this->assertSame('vies_circuit_open', $result['source']);
        $this->assertNotEmpty($result['error']);
    }
}
