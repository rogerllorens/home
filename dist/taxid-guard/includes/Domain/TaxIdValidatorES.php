<?php
declare(strict_types=1);
namespace TaxID_Guard\Domain;

defined( 'ABSPATH' ) || exit;

class TaxIdValidatorES {
    public static function validate( string $tax_id ): array {
        $tax_id = strtoupper( $tax_id );

        if ( preg_match( '/^[0-9]{8}[A-Z]$/', $tax_id ) ) {
            $number = substr( $tax_id, 0, 8 );
            $letter = substr( $tax_id, -1 );
            $map   = 'TRWAGMYFPDXBNJZSQVHLCKE';
            $calc  = $map[ (int) $number % 23 ];
            $valid = ( $letter === $calc );
            return [ 'valid' => $valid, 'method' => 'es_nif', 'status' => $valid ? 'valid' : 'invalid', 'message' => $valid ? '' : __( 'Invalid Spanish NIF.', 'taxid-guard-for-woocommerce' ) ];
        }

        if ( preg_match( '/^[XYZ][0-9]{7}[A-Z]$/', $tax_id ) ) {
            $letter = substr( $tax_id, -1 );
            $prefix = substr( $tax_id, 0, 1 );
            $number = substr( $tax_id, 1, 7 );
            $prefix_map = [ 'X' => '0', 'Y' => '1', 'Z' => '2' ];
            $numeric = $prefix_map[ $prefix ] . $number;
            $map  = 'TRWAGMYFPDXBNJZSQVHLCKE';
            $calc = $map[ (int) $numeric % 23 ];
            $valid = ( $letter === $calc );
            return [ 'valid' => $valid, 'method' => 'es_nie', 'status' => $valid ? 'valid' : 'invalid', 'message' => $valid ? '' : __( 'Invalid Spanish NIE.', 'taxid-guard-for-woocommerce' ) ];
        }

        if ( preg_match( '/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/', $tax_id ) ) {
            $digits  = substr( $tax_id, 1, 7 );
            $control = $tax_id[8];
            $sum_even = 0;
            $sum_odd  = 0;
            for ( $i = 0; $i < 7; $i++ ) {
                $n = (int) $digits[ $i ];
                if ( $i % 2 === 0 ) {
                    $n *= 2;
                    $sum_odd += intdiv( $n, 10 ) + ( $n % 10 );
                } else {
                    $sum_even += $n;
                }
            }
            $check = ( 10 - ( ( $sum_even + $sum_odd ) % 10 ) ) % 10;
            $map = 'JABCDEFGHI';
            $control_letter = $map[ $check ];
            $control_digit  = (string) $check;
            $valid = ( ctype_digit( $control ) && $control === $control_digit ) || ( ctype_alpha( $control ) && $control === $control_letter );
            return [ 'valid' => $valid, 'method' => 'es_cif', 'status' => $valid ? 'valid' : 'invalid', 'message' => $valid ? '' : __( 'Invalid Spanish CIF.', 'taxid-guard-for-woocommerce' ) ];
        }

        return [ 'valid' => false, 'method' => 'es_unknown', 'status' => 'invalid', 'message' => __( 'The tax identifier does not match known Spanish formats.', 'taxid-guard-for-woocommerce' ) ];
    }
}
