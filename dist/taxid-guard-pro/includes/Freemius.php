<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro;

final class Freemius
{
    private const PLACEHOLDER = 'missing';

    private static function get_id(): string
    {
        if (defined('TG_PRO_FS_ID')) {
            return (string) TG_PRO_FS_ID;
        }
        $env = getenv('TG_PRO_FS_ID');
        return is_string($env) ? $env : self::PLACEHOLDER;
    }

    private static function get_public_key(): string
    {
        if (defined('TG_PRO_FS_PUBLIC_KEY')) {
            return (string) TG_PRO_FS_PUBLIC_KEY;
        }
        $env = getenv('TG_PRO_FS_PUBLIC_KEY');
        return is_string($env) ? $env : self::PLACEHOLDER;
    }

    private static function has_valid_keys(): bool
    {
        $id = self::get_id();
        $key = self::get_public_key();

        return $id !== '' && $key !== '' && $id !== self::PLACEHOLDER && $key !== self::PLACEHOLDER;
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
            'id' => self::get_id(),
            'slug' => 'taxid-guard-pro',
            'type' => 'plugin',
            'public_key' => self::get_public_key(),
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
