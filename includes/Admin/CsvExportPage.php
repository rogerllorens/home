<?php
declare(strict_types=1);
namespace TaxID_Guard\Admin;

defined( 'ABSPATH' ) || exit;

class CsvExportPage {
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_menu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
    }

    public function register_menu(): void {
        add_submenu_page(
            'woocommerce',
            __( 'TaxID Export', 'taxid-guard-for-woocommerce' ),
            __( 'TaxID Export', 'taxid-guard-for-woocommerce' ),
            'manage_woocommerce',
            'tg-taxid-export',
            [ $this, 'render' ]
        );
    }

    public function enqueue_assets( $hook ): void {
        if ( 'woocommerce_page_tg-taxid-export' !== $hook ) {
            return;
        }
        if ( wp_script_is( 'selectWoo', 'registered' ) ) {
            wp_enqueue_script( 'selectWoo' );
        }
        if ( wp_style_is( 'selectWoo', 'registered' ) ) {
            wp_enqueue_style( 'selectWoo' );
        } else {
            wp_enqueue_style( 'woocommerce_admin_styles' );
        }
    }

    public function render(): void {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( __( 'Insufficient permissions.', 'taxid-guard-for-woocommerce' ) );
        }

        if ( isset( $_POST['tg_export_nonce'] )
            && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tg_export_nonce'] ?? '' ) ), 'tg_export' ) ) {
            $this->process_export();
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Export Orders with Tax ID', 'taxid-guard-for-woocommerce' ); ?></h1>
            <form method="post">
                <?php wp_nonce_field( 'tg_export', 'tg_export_nonce' ); ?>
                <table class="form-table">
                    <tr><th><?php esc_html_e( 'Date from', 'taxid-guard-for-woocommerce' ); ?></th><td><input type="date" name="date_from" required></td></tr>
                    <tr><th><?php esc_html_e( 'Date to', 'taxid-guard-for-woocommerce' ); ?></th><td><input type="date" name="date_to" required></td></tr>
                    <tr>
                        <th><?php esc_html_e( 'Status', 'taxid-guard-for-woocommerce' ); ?></th>
                        <td>
                            <select name="status[]" multiple class="wc-enhanced-select" style="min-width:200px;">
                                <option value="valid"><?php esc_html_e( 'Valid', 'taxid-guard-for-woocommerce' ); ?></option>
                                <option value="invalid"><?php esc_html_e( 'Invalid', 'taxid-guard-for-woocommerce' ); ?></option>
                                <option value="skipped"><?php esc_html_e( 'Skipped', 'taxid-guard-for-woocommerce' ); ?></option>
                                <option value="unverified"><?php esc_html_e( 'Unverified (VIES)', 'taxid-guard-for-woocommerce' ); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr><th><?php esc_html_e( 'Mask Tax ID?', 'taxid-guard-for-woocommerce' ); ?></th><td><input type="checkbox" name="mask" value="yes"></td></tr>
                </table>
                <?php submit_button( __( 'Download CSV', 'taxid-guard-for-woocommerce' ) ); ?>
            </form>
        </div>
        <?php
    }

    private function process_export(): void {
        while ( ob_get_level() ) {
            ob_end_clean();
        }
        nocache_headers();

        $date_from = sanitize_text_field( wp_unslash( $_POST['date_from'] ?? '' ) );
        $date_to   = sanitize_text_field( wp_unslash( $_POST['date_to'] ?? '' ) );
        $statuses_raw = (array) ( $_POST['status'] ?? [] );
        $statuses_raw = wp_unslash( $statuses_raw );
        $statuses = array_map( 'sanitize_text_field', $statuses_raw );
        $mask = ( isset( $_POST['mask'] ) && $_POST['mask'] === 'yes' );

        $ts_from = strtotime( $date_from );
        $ts_to   = strtotime( $date_to );
        if ( ! $ts_from || ! $ts_to ) {
            wp_die( __( 'Invalid date range.', 'taxid-guard-for-woocommerce' ) );
        }
        if ( $ts_from > $ts_to ) {
            wp_die( __( 'Invalid date range (From is later than To).', 'taxid-guard-for-woocommerce' ) );
        }

        $date_from = date( 'Y-m-d', $ts_from );
        $date_to   = date( 'Y-m-d', $ts_to );

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename=taxid-export-' . current_time( 'Ymd-His' ) . '.csv' );
        $fp = fopen( 'php://output', 'w' );
        fprintf( $fp, chr(0xEF).chr(0xBB).chr(0xBF) );
        fputcsv( $fp, [ 'order_id', 'date', 'billing_country', 'is_company', 'tax_id', 'status', 'validation_method', 'vies_valid', 'vies_name', 'vies_address' ] );

        $page = 1;
        do {
            $args = [
                'limit'        => 500,
                'page'         => $page,
                'return'       => 'objects',
                'date_created' => $date_from . ' 00:00:00...' . $date_to . ' 23:59:59',
                'meta_query'   => [ [ 'key' => '_tg_tax_id', 'compare' => 'EXISTS' ] ],
            ];

            if ( $statuses ) {
                $args['meta_query'][] = [ 'key' => '_tg_tax_id_status', 'value' => $statuses, 'compare' => 'IN' ];
            }

            $orders = wc_get_orders( $args );

            foreach ( $orders as $order ) {
                $tax_id = $order->get_meta( '_tg_tax_id', true );
                if ( '' === $tax_id ) {
                    continue;
                }

                $date_obj = $order->get_date_created();
                $date_str = $date_obj ? $date_obj->date( 'Y-m-d H:i:s' ) : '';

                fputcsv( $fp, [
                    $order->get_id(), $date_str, $order->get_billing_country(), $order->get_meta( '_tg_is_company', true ),
                    $mask ? $this->mask_tax_id( $tax_id ) : $tax_id,
                    $order->get_meta( '_tg_tax_id_status', true ), $order->get_meta( '_tg_tax_id_validation', true ),
                    $order->get_meta( '_tg_vies_valid', true ), $order->get_meta( '_tg_vies_name', true ), $order->get_meta( '_tg_vies_address', true ),
                ] );
            }

            $page++;
        } while ( count( $orders ) === 500 );

        fclose( $fp );
        exit;
    }

    private function mask_tax_id( string $tax_id ): string {
        $len = strlen( $tax_id );
        if ( $len <= 5 ) {
            return str_repeat( '*', $len );
        }
        return substr( $tax_id, 0, 3 ) . str_repeat( '*', $len - 5 ) . substr( $tax_id, -2 );
    }
}
