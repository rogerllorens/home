<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Admin\SettingsPage;

final class SettingsSanitizationTest extends TestCase
{
    public function testIso2ListSanitizesToUppercaseCountryCodesOnly(): void
    {
        $settings = new SettingsPage();
        $result = $settings->sanitize_iso2_list('es, it, stripe, de, ES, abc');

        $this->assertSame(['ES', 'IT', 'DE'], $result);
    }

    public function testSlugListKeepsCaseSensitiveGatewayAndRoleIds(): void
    {
        $settings = new SettingsPage();
        $result = $settings->sanitize_slug_list('customer,administrator,stripe,flat_rate:1');

        $this->assertSame(['customer', 'administrator', 'stripe', 'flat_rate:1'], $result);
    }
}
