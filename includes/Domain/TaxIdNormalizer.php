<?php
declare(strict_types=1);
namespace TaxID_Guard\Domain;

defined( 'ABSPATH' ) || exit;

class TaxIdNormalizer {
    public static function normalize( $raw ): string {
        $raw = (string) $raw;
        $raw = strtoupper( trim( $raw ) );
        $raw = str_replace( [ ' ', '-', '.', '/', '\\', "\t", "\n", "\r" ], '', $raw );
        $raw = preg_replace( '/[^A-Z0-9]/', '', $raw ) ?? '';
        if ( strlen( $raw ) > 24 ) {
            $raw = substr( $raw, 0, 24 );
        }
        return $raw;
    }
}
