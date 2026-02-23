<?php
declare(strict_types=1);
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

if ( get_option( 'tg_delete_data_on_uninstall', 'no' ) !== 'yes' ) {
    return;
}

$options = [
    'tg_enable', 'tg_mode', 'tg_show_company_checkbox', 'tg_show_taxid_field', 'tg_vat_prefix_auto',
    'tg_taxid_label', 'tg_taxid_help', 'tg_required_countries', 'tg_company_requires_taxid',
    'tg_validate_es', 'tg_validate_eu_vat', 'tg_save_taxid_profile', 'tg_show_in_admin',
    'tg_email_admin', 'tg_debug',
    'tg_label_by_country', 'tg_help_by_country',
    'tg_plugin_version', 'tg_settings_schema_version', 'tg_schema_version',
    'tg_store_ip_address', 'tg_data_retention_days', 'tg_delete_data_on_uninstall'
];

global $wpdb;

$delete_transients = function() use ( $wpdb ) {
    $like1 = $wpdb->esc_like( '_transient_tg_vies_' ) . '%';
    $like2 = $wpdb->esc_like( '_transient_timeout_tg_vies_' ) . '%';
    $like3 = $wpdb->esc_like( '_transient_tg_vies_fail_state' ) . '%';
    $like4 = $wpdb->esc_like( '_transient_timeout_tg_vies_fail_state' ) . '%';
    $like5 = $wpdb->esc_like( '_transient_tg_vies_circuit_open' ) . '%';
    $like6 = $wpdb->esc_like( '_transient_timeout_tg_vies_circuit_open' ) . '%';
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like1 ) );
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like2 ) );
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like3 ) );
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like4 ) );
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like5 ) );
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $like6 ) );
};

if ( is_multisite() ) {
    $sites = get_sites( [ 'fields' => 'ids' ] );
    foreach ( $sites as $site_id ) {
        switch_to_blog( $site_id );
        foreach ( $options as $opt ) {
            delete_option( $opt );
        }
        $delete_transients();
        restore_current_blog();
    }
} else {
    foreach ( $options as $opt ) {
        delete_option( $opt );
    }
    $delete_transients();
}
