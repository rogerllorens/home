<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard_Pro\ProHooks;

final class ProHooksTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_test_options_by_blog'][1] = [];
        $GLOBALS['wc_stub']->session = new class {
            private array $data = [];
            public function get(string $key) { return $this->data[$key] ?? null; }
            public function set(string $key, $value): void { $this->data[$key] = $value; }
        };
    }

    public function testGatePaymentMethodsForInvalidVat(): void
    {
        require_once __DIR__ . '/../dist/taxid-guard-pro/includes/ProHooks.php';
        require_once __DIR__ . '/../dist/taxid-guard-pro/includes/Pro/ViesService.php';
        require_once __DIR__ . '/../dist/taxid-guard-pro/includes/Admin/ProAdminPages.php';

        update_option('tg_gate_payment_methods_when_vat_invalid', 'yes');
        update_option('tg_allowed_payment_methods_if_vat_invalid', ['bacs']);
        WC()->session->set('tg_pro_vat_state', ['status' => 'invalid']);

        $hooks = new ProHooks();
        $gateways = [
            'bacs' => (object) ['id' => 'bacs'],
            'cod' => (object) ['id' => 'cod'],
        ];

        $filtered = $hooks->gate_payment_methods($gateways);

        $this->assertArrayHasKey('bacs', $filtered);
        $this->assertArrayNotHasKey('cod', $filtered);
    }
}
