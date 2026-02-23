<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Pro\Rules\ProContext;
use TaxID_Guard\Pro\Rules\ProRules;
use TaxID_Guard\Pro\Rules\ProSettings;
use TaxID_Guard\ValueObjects\TaxIdInput;

final class ProRulesTest extends TestCase
{
    /** @dataProvider provideRules */
    public function testShouldRequireByRules(TaxIdInput $input, ProContext $ctx, ProSettings $settings, bool $expected): void
    {
        $this->assertSame($expected, ProRules::shouldRequire($input, $ctx, $settings));
    }

    public static function provideRules(): array
    {
        $input = new TaxIdInput(true, 'DE123456789', 'DE');
        return [
            'role_mismatch' => [$input, new ProContext(['customer'], 100, null, [], false, 'DE'), new ProSettings(['administrator']), false],
            'country_mismatch' => [$input, new ProContext(['customer'], 100, null, [], false, 'DE'), new ProSettings([], ['ES']), false],
            'min_cart_not_reached' => [$input, new ProContext(['customer'], 49, null, [], false, 'DE'), new ProSettings([], [], 50), false],
            'excluded_payment' => [$input, new ProContext(['customer'], 100, 'stripe', [], false, 'DE'), new ProSettings([], [], 0, ['stripe']), false],
            'excluded_shipping' => [$input, new ProContext(['customer'], 100, null, ['flat_rate:1'], false, 'DE'), new ProSettings([], [], 0, [], ['flat_rate:1']), false],
            'excluded_virtual' => [$input, new ProContext(['customer'], 100, null, [], true, 'DE'), new ProSettings([], [], 0, [], [], true), false],
            'all_match' => [$input, new ProContext(['customer'], 120, 'cod', ['flat_rate:1'], false, 'DE'), new ProSettings(['customer'], ['DE'], 100, ['bacs'], ['free_shipping:2'], false), true],
            'case_sensitive_role' => [$input, new ProContext(['Customer'], 120, 'cod', [], false, 'DE'), new ProSettings(['customer']), false],
            'case_sensitive_payment' => [$input, new ProContext(['customer'], 120, 'Stripe', [], false, 'DE'), new ProSettings([], [], 0, ['stripe']), true],
            'shipping_exact_match_only' => [$input, new ProContext(['customer'], 120, null, ['flat_rate:10'], false, 'DE'), new ProSettings([], [], 0, [], ['flat_rate:1']), true],
        ];
    }
}
