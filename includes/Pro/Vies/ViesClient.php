<?php
declare(strict_types=1);
namespace TaxID_Guard\Pro\Vies;

defined( 'ABSPATH' ) || exit;

class ViesClient implements ViesClientInterface {
    private string $wsdl = 'https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl';

    public function check( string $country, string $vat ): array {
        $result = [ 'valid' => null, 'name' => null, 'address' => null, 'error' => null, 'source' => 'vies' ];

        if ( ! class_exists( '\SoapClient' ) ) {
            $result['error'] = __( 'SOAP extension is not available.', 'taxid-guard-for-woocommerce' );
            return $result;
        }

        $timeout = (int) apply_filters( 'tg_vies_timeout', 3 );

        try {
            $client = new \SoapClient( $this->wsdl, [
                'cache_wsdl' => WSDL_CACHE_MEMORY,
                'connection_timeout'=> $timeout,
                'stream_context' => stream_context_create( [ 'http' => [ 'timeout' => $timeout ] ] ),
                'exceptions' => true,
            ] );

            $response = $client->checkVat( [ 'countryCode' => $country, 'vatNumber' => $vat ] );
            $result['valid']   = (bool) $response->valid;
            $result['name']    = $response->name ?? '';
            $result['address'] = $response->address ?? '';
        } catch ( \Throwable $e ) {
            $message = (string) $e->getMessage();
            $result['error'] = $message;
            $result['source'] = stripos($message, 'timeout') !== false ? 'vies_timeout' : 'vies_exception';
        }

        return $result;
    }
}
