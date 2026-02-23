<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro;

final class Freemius
{

    private static function has_valid_keys(): bool
    {
        $id = defined('TG_PRO_FS_ID') ? (string) TG_PRO_FS_ID : 'REPLACE_ME';
        $key = defined('TG_PRO_FS_PUBLIC_KEY') ? (string) TG_PRO_FS_PUBLIC_KEY : 'REPLACE_ME';

        return $id !== '' && $key !== '' && $id !== 'REPLACE_ME' && $key !== 'REPLACE_ME';
    }

    public static function instance()
    {
        static $fs = null;

        if ($fs !== null) {
            return $fs;
        }

        if (! self::has_valid_keys()) {
            $fs = false;
            return $fs;
        }

        $sdk = TG_PRO_PATH . 'freemius/start.php';
        if (!file_exists($sdk)) {
            $fs = false;
            return $fs;
        }

        require_once $sdk;

        $fs = fs_dynamic_init([
            'id' => defined('TG_PRO_FS_ID') ? TG_PRO_FS_ID : 'REPLACE_ME',
            'slug' => 'taxid-guard-pro',
            'type' => 'plugin',
            'public_key' => defined('TG_PRO_FS_PUBLIC_KEY') ? TG_PRO_FS_PUBLIC_KEY : 'REPLACE_ME',
            'is_premium' => true,
            'has_paid_plans' => true,
            'menu' => ['slug' => 'taxid-guard-pro'],
        ]);

        return $fs;
    }

    public static function is_active_license(): bool
    {
        $fs = self::instance();
        return (bool) ($fs && method_exists($fs, 'is_paying') && $fs->is_paying());
    }
}
