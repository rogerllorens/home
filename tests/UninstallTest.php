<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class UninstallTest extends TestCase
{
    protected function setUp(): void
    {
        $GLOBALS['tg_blog_id'] = 1;
        $GLOBALS['tg_is_multisite'] = false;
        $GLOBALS['tg_sites'] = [1];
        $GLOBALS['tg_test_options_by_blog'] = [1 => []];
        $GLOBALS['tg_test_transients_by_blog'] = [1 => []];
    }

    public function testUninstallCleansSingleSiteOptionsAndTransients(): void
    {
        update_option('tg_enable', 'yes');
        update_option('tg_taxid_label', 'VAT');
        set_transient('tg_vies_abc', ['valid' => true], 3600);
        set_transient('tg_vies_fail_state', ['count' => 2], 3600);

        include __DIR__ . '/../uninstall.php';

        $this->assertFalse(get_option('tg_enable', false));
        $this->assertFalse(get_option('tg_taxid_label', false));
        $this->assertFalse(get_transient('tg_vies_abc'));
        $this->assertFalse(get_option('_transient_tg_vies_abc', false));
    }

    public function testUninstallCleansAllSitesInMultisiteMode(): void
    {
        $GLOBALS['tg_is_multisite'] = true;
        $GLOBALS['tg_sites'] = [1, 2];
        $GLOBALS['tg_test_options_by_blog'] = [1 => [], 2 => []];
        $GLOBALS['tg_test_transients_by_blog'] = [1 => [], 2 => []];

        switch_to_blog(1);
        update_option('tg_enable', 'yes');
        set_transient('tg_vies_1', ['valid' => true], 3600);
        restore_current_blog();

        switch_to_blog(2);
        update_option('tg_enable', 'yes');
        set_transient('tg_vies_2', ['valid' => true], 3600);
        restore_current_blog();

        include __DIR__ . '/../uninstall.php';

        switch_to_blog(1);
        $this->assertFalse(get_option('tg_enable', false));
        $this->assertFalse(get_option('_transient_tg_vies_1', false));
        restore_current_blog();

        switch_to_blog(2);
        $this->assertFalse(get_option('tg_enable', false));
        $this->assertFalse(get_option('_transient_tg_vies_2', false));
        restore_current_blog();
    }
}
