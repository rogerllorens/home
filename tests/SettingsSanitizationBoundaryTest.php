<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Admin\SettingsPage;

final class SettingsSanitizationBoundaryTest extends TestCase
{
    public function testSanitizeFloatHandlesCommaAndRange(): void
    {
        $settings = new SettingsPage();
        $this->assertSame(1.5, $settings->sanitize_float('1,5', 0.0, 5.0, 0.0));
        $this->assertSame(5.0, $settings->sanitize_float('99', 0.0, 5.0, 0.0));
        $this->assertSame(0.0, $settings->sanitize_float('foo', 0.0, 5.0, 0.0));
    }

    public function testSanitizeIntRangeBounds(): void
    {
        $settings = new SettingsPage();
        $this->assertSame(3650, $settings->sanitize_int_range('99999', 0, 3650, 365));
        $this->assertSame(0, $settings->sanitize_int_range('-10', 0, 3650, 365));
        $this->assertSame(365, $settings->sanitize_int_range('bar', 0, 3650, 365));
    }
}
