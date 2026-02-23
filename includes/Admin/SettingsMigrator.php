<?php
declare(strict_types=1);

namespace TaxID_Guard\Admin;

defined('ABSPATH') || exit;

final class SettingsMigrator
{
    public static function run(): void
    {
        $schema = (string) get_option('tg_schema_version', '0');
        $pluginVersion = (string) get_option('tg_plugin_version', '0');

        if (version_compare($schema, '1.1.0', '<')) {
            self::migrate_country_maps(['tg_label_by_country', 'tg_help_by_country']);
            self::migrate_legacy_selects();
            update_option('tg_schema_version', '1.1.0');
        }

        if (version_compare($pluginVersion, TG_VERSION, '<')) {
            update_option('tg_plugin_version', TG_VERSION);
        }
    }

    private static function migrate_country_maps(array $keys): void
    {
        foreach ($keys as $key) {
            $raw = maybe_unserialize(get_option($key, []));
            $normalized = [];

            if (is_string($raw)) {
                $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];
                foreach ($lines as $line) {
                    $line = trim((string) $line);
                    if ($line === '' || strpos($line, '=') === false) {
                        continue;
                    }
                    [$k, $value] = array_map('trim', explode('=', $line, 2));
                    $country = strtoupper($k);
                    if (! preg_match('/^[A-Z]{2}$/', $country) || $value === '') {
                        continue;
                    }
                    $normalized[$country] = sanitize_text_field($value);
                }
            } elseif (is_array($raw)) {
                foreach ($raw as $country => $value) {
                    $countryCode = strtoupper((string) $country);
                    $cleanValue = sanitize_text_field((string) $value);
                    if (preg_match('/^[A-Z]{2}$/', $countryCode) && $cleanValue !== '') {
                        $normalized[$countryCode] = $cleanValue;
                    }
                }
            }

            update_option($key, $normalized);
        }
    }

    private static function migrate_legacy_selects(): void
    {
        $legacy = get_option('tg_show_taxid_field', 'always');
        if ($legacy === 'yes') {
            update_option('tg_show_taxid_field', 'always');
        } elseif ($legacy === 'no') {
            update_option('tg_show_taxid_field', 'no');
        }
    }
}
