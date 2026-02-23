<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro\Pro;

final class ViesService
{
    public function check(string $country, string $vat): array
    {
        $result = ['valid' => null, 'message' => '', 'source' => 'vies'];

        if (!class_exists('\\SoapClient')) {
            $result['message'] = __('SOAP extension is not available.', 'taxid-guard-pro');
            $result['source'] = 'soap_missing';
            return $result;
        }

        try {
            $client = new \SoapClient('https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl', [
                'connection_timeout' => 3,
                'exceptions' => true,
            ]);
            $resp = $client->checkVat([
                'countryCode' => strtoupper($country),
                'vatNumber' => preg_replace('/[^A-Z0-9]/', '', strtoupper($vat)),
            ]);
            $result['valid'] = (bool) ($resp->valid ?? false);
            return $result;
        } catch (\Throwable $e) {
            $result['message'] = $e->getMessage();
            $result['source'] = 'vies_error';
            return $result;
        }
    }
}
