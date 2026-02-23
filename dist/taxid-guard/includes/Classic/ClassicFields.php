<?php
declare(strict_types=1);
namespace TaxID_Guard\Classic;

defined( 'ABSPATH' ) || exit;

class ClassicFields {
    public function __construct() {
        add_filter( 'woocommerce_checkout_fields', [ $this, 'add_fields' ] );
    }

    public function add_fields( array $fields ): array {
        if ( 'yes' !== get_option( 'tg_enable', 'yes' ) ) {
            return $fields;
        }

        $show_company = ( 'yes' === get_option( 'tg_show_company_checkbox', 'yes' ) );
        if ( $show_company ) {
            $default = false;
            if ( is_user_logged_in() && 'yes' === get_option( 'tg_save_taxid_profile', 'no' ) ) {
                $default = get_user_meta( get_current_user_id(), '_tg_is_company', true ) === 'yes';
            }

            $fields['billing']['tg_is_company'] = [
                'type'        => 'checkbox',
                'label'       => __( 'I am a company', 'taxid-guard-for-woocommerce' ),
                'required'    => false,
                'default'     => $default,
                'class'       => [ 'form-row-wide' ],
                'priority'    => 30,
                'max_length'  => 0,
            ];
        }

        $show_taxid = ( 'always' === get_option( 'tg_show_taxid_field', 'always' )
                      || ( 'company' === get_option( 'tg_show_taxid_field', 'always' ) && $show_company ) );

        if ( $show_taxid ) {
            $country = $this->detect_country();
            $label = $this->get_dynamic_label( $country );
            $help  = $this->get_dynamic_help( $country );

            $default = '';
            if ( is_user_logged_in() && 'yes' === get_option( 'tg_save_taxid_profile', 'no' ) ) {
                $default = (string) get_user_meta( get_current_user_id(), '_tg_tax_id', true );
            }

            $description = $help;
            if ( 'company' === get_option( 'tg_show_taxid_field', 'always' ) && $show_company ) {
                $description = trim( $description . ' ' . __( '(Only required if “I am a company” is checked)', 'taxid-guard-for-woocommerce' ) );
            }

            $fields['billing']['tg_tax_id'] = [
                'type'        => 'text',
                'label'       => $label,
                'placeholder' => $this->get_placeholder_by_country( $country ),
                'required'    => false,
                'class'       => [ 'form-row-wide' ],
                'priority'    => 40,
                'default'     => $default,
                'description' => $description,
                'autocomplete'=> 'off',
                'max_length'  => 24,
                'maxlength'   => 24,
                'inputmode'   => 'text',
                'spellcheck'  => false,
            ];
        }

        return $fields;
    }

    private function detect_country(): string {
        if ( function_exists( 'WC' ) && WC()->customer ) {
            $c = WC()->customer;
            $country = $c->get_billing_country() ?: $c->get_shipping_country();
            $country = strtoupper( $country );
            if ( preg_match( '/^[A-Z]{2}$/', $country ) ) {
                return $country;
            }
        }

        if ( is_user_logged_in() ) {
            $meta = get_user_meta( get_current_user_id(), 'billing_country', true );
            $meta = strtoupper( (string) $meta );
            if ( preg_match( '/^[A-Z]{2}$/', $meta ) ) {
                return $meta;
            }
        }

        $default = (string) get_option( 'woocommerce_default_country', '' );
        $code    = strtoupper( substr( $default, 0, 2 ) );
        return preg_match( '/^[A-Z]{2}$/', $code ) ? $code : '';
    }

    private function get_dynamic_label( string $country ): string {
        $dict = get_option( 'tg_label_by_country', [] );
        if ( is_array( $dict ) && isset( $dict[ $country ] ) && $dict[ $country ] ) {
            return (string) $dict[ $country ];
        }
        return get_option( 'tg_taxid_label', __( 'Tax Identifier (NIF/CIF/NIE/VAT)', 'taxid-guard-for-woocommerce' ) );
    }

    private function get_dynamic_help( string $country ): string {
        $dict = get_option( 'tg_help_by_country', [] );
        if ( is_array( $dict ) && isset( $dict[ $country ] ) && $dict[ $country ] ) {
            return (string) $dict[ $country ];
        }
        return get_option( 'tg_taxid_help', __( 'If you purchase as a company, we need your tax identifier.', 'taxid-guard-for-woocommerce' ) );
    }

    private function get_placeholder_by_country( string $country ): string {
        if ( 'US' === $country ) {
            return __( 'e.g. 12-3456789', 'taxid-guard-for-woocommerce' );
        }
        return __( 'e.g. B12345678 / X1234567T / ESB12345678', 'taxid-guard-for-woocommerce' );
    }
}
