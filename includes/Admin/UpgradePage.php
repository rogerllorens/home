<?php
declare(strict_types=1);
namespace TaxID_Guard\Admin;

defined( 'ABSPATH' ) || exit;

class UpgradePage {
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_upgrade_page' ] );
    }

    public function add_upgrade_page(): void {
        add_submenu_page(
            'woocommerce',
            __( 'Upgrade to Pro', 'taxid-guard-for-woocommerce' ),
            __( 'Upgrade to Pro', 'taxid-guard-for-woocommerce' ),
            'manage_woocommerce',
            'tg_taxid_upgrade',
            [ $this, 'render' ]
        );
    }

    public function render(): void {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( __( 'Insufficient permissions.', 'taxid-guard-for-woocommerce' ) );
        }
        $upgrade_url = (string) apply_filters( 'tg_taxid_guard_upgrade_url', TG_UPGRADE_URL );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Upgrade to TaxID Guard Pro', 'taxid-guard-for-woocommerce' ); ?></h1>
            <p><?php esc_html_e( 'Unlock VIES validation, advanced B2B rules, CSV export and more.', 'taxid-guard-for-woocommerce' ); ?></p>
            <p><a href="<?php echo esc_url( $upgrade_url ); ?>" class="button button-primary button-large"><?php esc_html_e( 'Upgrade now', 'taxid-guard-for-woocommerce' ); ?></a></p>
        </div>
        <?php
    }
}
