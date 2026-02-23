<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TaxID_Guard\Admin\SettingsMigrator;

final class SettingsMigratorTest extends TestCase
{
    public function testMigratesLegacySettings(): void
    {
        if (!defined('TG_VERSION')) {
            define('TG_VERSION', '1.2.1');
        }

        update_option('tg_schema_version', '0.9.0');
        update_option('tg_plugin_version', '0.9.0');
        update_option('tg_show_taxid_field', 'yes');
        update_option('tg_label_by_country', "es=IVA\nit=NIF");

        require_once __DIR__ . '/../includes/Admin/SettingsMigrator.php';
        SettingsMigrator::run();

        $this->assertSame('always', get_option('tg_show_taxid_field'));
        $this->assertSame(['ES' => 'IVA', 'IT' => 'NIF'], get_option('tg_label_by_country'));
        $this->assertSame('1.1.0', get_option('tg_schema_version'));
        $this->assertSame('1.2.1', get_option('tg_plugin_version'));
    }
}
