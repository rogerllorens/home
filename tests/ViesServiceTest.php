<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Pro\Vies\ViesClientInterface;
use TaxID_Guard\Pro\Vies\ViesService;

final class ViesServiceTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_blog_id'] = 1;
        $GLOBALS['tg_test_options_by_blog'] = [1 => ['tg_vies_cache_hours' => 24]];
        $GLOBALS['tg_test_transients_by_blog'] = [1 => []];
    }

    public function testUsesCacheAndCallsClientOnlyOnce(): void
    {
        $client = new class implements ViesClientInterface {
            public int $calls = 0;
            public function check(string $country, string $vat): array {
                $this->calls++;
                return ['valid' => true, 'source' => 'vies'];
            }
        };

        $service = new ViesService($client);
        $a = $service->check('DE', 'DE123456789');
        $b = $service->check('DE', 'DE123456789');

        $this->assertTrue($a['valid']);
        $this->assertTrue($b['valid']);
        $this->assertSame(1, $client->calls);
    }

    public function testEvaluateInvalidReturnsInvalidCode(): void
    {
        $client = new class implements ViesClientInterface {
            public function check(string $country, string $vat): array {
                return ['valid' => false, 'source' => 'vies'];
            }
        };
        $service = new ViesService($client);
        $r = $service->evaluate('DE', 'DE123', 'block');
        $this->assertFalse($r['ok']);
        $this->assertSame('TG_VIES_INVALID', $r['code']);
    }

    public function testEvaluateSoapMissingRespectsFailMode(): void
    {
        $client = new class implements ViesClientInterface {
            public function check(string $country, string $vat): array {
                return ['valid' => null, 'source' => 'soap_missing'];
            }
        };
        $service = new ViesService($client);
        $block = $service->evaluate('DE', 'DE123', 'block');
        $allow = $service->evaluate('DE', 'DE123', 'allow');

        $this->assertFalse($block['ok']);
        $this->assertTrue($allow['ok']);
        $this->assertSame('TG_VIES_SOAP_MISSING', $block['code']);
    }

    public function testCircuitBreakerOpensAfterRepeatedFailures(): void
    {
        $client = new class implements ViesClientInterface {
            public int $calls = 0;
            public function check(string $country, string $vat): array {
                $this->calls++;
                return ['valid' => null, 'source' => 'vies_exception', 'error' => 'timeout'];
            }
        };

        $service = new ViesService($client);
        $service->check('DE', '1');
        $service->check('DE', '2');
        $service->check('DE', '3');

        $this->assertTrue($service->is_circuit_breaker_open());

        $before = $client->calls;
        $result = $service->evaluate('DE', '4', 'block');
        $this->assertSame($before, $client->calls, 'client should not be called while circuit open');
        $this->assertFalse($result['ok']);
        $this->assertSame('TG_VIES_UNAVAILABLE_BLOCKED', $result['code']);
    }
}
