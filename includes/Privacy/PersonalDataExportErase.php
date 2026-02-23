<?php
declare(strict_types=1);

namespace TaxID_Guard\Privacy;

defined('ABSPATH') || exit;

class PersonalDataExportErase
{
    private const USER_META_KEYS = [
        '_tg_tax_id',
        '_tg_is_company',
        '_tg_tax_id_country',
        '_tg_tax_id_validation',
        '_tg_tax_id_status',
        '_tg_vies_valid',
        '_tg_vies_checked_at',
        '_tg_vies_name',
        '_tg_vies_address',
        '_tg_vies_error',
        '_tg_vies_source',
    ];

    public function __construct()
    {
        add_filter('wp_privacy_personal_data_exporters', [$this, 'register_exporter']);
        add_filter('wp_privacy_personal_data_erasers', [$this, 'register_eraser']);
    }

    public function register_exporter(array $exporters): array
    {
        $exporters[] = [
            'exporter_friendly_name' => __('TaxID Guard data', 'taxid-guard-for-woocommerce'),
            'callback' => [$this, 'personal_data_exporter'],
        ];
        return $exporters;
    }

    public function register_eraser(array $erasers): array
    {
        $erasers[] = [
            'eraser_friendly_name' => __('TaxID Guard data', 'taxid-guard-for-woocommerce'),
            'callback' => [$this, 'personal_data_eraser'],
        ];
        return $erasers;
    }

    public function personal_data_exporter(string $email_address): array
    {
        $user = get_user_by('email', $email_address);
        if (! $user) {
            return ['data' => [], 'done' => true];
        }

        $export_items = [];
        foreach (self::USER_META_KEYS as $key) {
            $value = get_user_meta($user->ID, $key, true);
            if ($value === '' || $value === null) {
                continue;
            }
            $export_items[] = [
                'group_id' => 'taxid_guard',
                'group_label' => __('TaxID Guard', 'taxid-guard-for-woocommerce'),
                'item_id' => $key,
                'data' => [[
                    'name' => $key,
                    'value' => (string) $value,
                ]],
            ];
        }

        return ['data' => $export_items, 'done' => true];
    }

    public function personal_data_eraser(string $email_address): array
    {
        $user = get_user_by('email', $email_address);
        if (! $user) {
            return ['items_removed' => false, 'items_retained' => false, 'messages' => []];
        }

        $removed = false;
        foreach (self::USER_META_KEYS as $key) {
            delete_user_meta($user->ID, $key);
            $removed = true;
        }

        return [
            'items_removed' => $removed,
            'items_retained' => false,
            'messages' => $removed ? [__('TaxID Guard data erased.', 'taxid-guard-for-woocommerce')] : [],
            'done' => true,
        ];
    }
}
