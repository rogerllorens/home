<?php
declare(strict_types=1);
namespace TaxID_Guard\Domain;

defined( 'ABSPATH' ) || exit;

class TaxIdValidatorEU {
    private static $patterns = [
        'AT' => '/^ATU[0-9]{8}$/','BE' => '/^BE0[0-9]{9}$/','BG' => '/^BG[0-9]{9,10}$/','CY' => '/^CY[0-9]{8}[A-Z]$/',
        'CZ' => '/^CZ[0-9]{8,10}$/','DE' => '/^DE[0-9]{9}$/','DK' => '/^DK[0-9]{8}$/','EE' => '/^EE[0-9]{9}$/',
        'EL' => '/^EL[0-9]{9}$/','GR' => '/^GR[0-9]{9}$/','ES' => '/^ES[0-9A-Z]{9}$/','FI' => '/^FI[0-9]{8}$/',
        'FR' => '/^FR[0-9A-Z]{2}[0-9]{9}$/','HR' => '/^HR[0-9]{11}$/','HU' => '/^HU[0-9]{8}$/','IE' => '/^IE[0-9]?[0-9A-Z]{1,2}[0-9]{5}[A-Z]?$/',
        'IT' => '/^IT[0-9]{11}$/','LT' => '/^LT[0-9]{9,12}$/','LU' => '/^LU[0-9]{8}$/','LV' => '/^LV[0-9]{11}$/',
        'MT' => '/^MT[0-9]{8}$/','NL' => '/^NL[0-9]{9}B[0-9]{2}$/','PL' => '/^PL[0-9]{10}$/','PT' => '/^PT[0-9]{9}$/',
        'RO' => '/^RO[0-9]{2,10}$/','SE' => '/^SE[0-9]{12}$/','SI' => '/^SI[0-9]{8}$/','SK' => '/^SK[0-9]{10}$/','XI' => '/^XI[0-9]{9}$/',
    ];

    public static function validate( string $country, string $tax_id ): array {
        if ( isset( self::$patterns[ $country ] ) ) {
            $valid = (bool) preg_match( self::$patterns[ $country ], $tax_id );
            return [ 'valid' => $valid, 'method' => 'eu_vat_format', 'status' => $valid ? 'valid' : 'invalid', 'message' => $valid ? '' : __( 'The VAT number does not appear to be valid.', 'taxid-guard-for-woocommerce' ) ];
        }
        $valid = (bool) preg_match( '/^[A-Z0-9]{4,24}$/', $tax_id );
        return [ 'valid' => $valid, 'method' => 'eu_vat_fallback', 'status' => $valid ? 'valid' : 'invalid', 'message' => $valid ? '' : __( 'The VAT number does not appear to be valid.', 'taxid-guard-for-woocommerce' ) ];
    }

    public static function is_eu_country(string $country): bool {
        $country = strtoupper($country === 'GR' ? 'EL' : $country);
        static $eu = ['AT','BE','BG','HR','CY','CZ','DE','DK','EE','EL','ES','FI','FR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK','XI'];
        return in_array($country, $eu, true);
    }
}
