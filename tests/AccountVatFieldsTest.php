<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class AccountVatFieldsTest extends TestCase
{
    protected function setUp(): void
    {
        $_POST = [];
        update_option('tg_collect_vat_on_signup', 'yes');
        $GLOBALS['tg_user_meta'] = [];
    }

    public function testSaveSignupFieldStoresNormalizedMeta(): void
    {
        $_POST['tg_signup_vat'] = 'es b12345678';
        $fields = new \TaxID_Guard\Classic\AccountVatFields();
        $fields->save_signup_field(10);

        $this->assertSame('ESB12345678', get_user_meta(10, '_tg_tax_id', true));
        $this->assertSame('yes', get_user_meta(10, '_tg_is_company', true));
    }
}
