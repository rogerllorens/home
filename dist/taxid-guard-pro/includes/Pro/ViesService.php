<?php
declare(strict_types=1);

namespace TaxID_Guard_Pro\Pro;

final class ViesService
{
    private const CACHE_PREFIX = 'tg_pro_vies_';
    private const FAIL_STATE_KEY = 'tg_pro_vies_fail_state';
    private const CIRCUIT_KEY = 'tg_pro_vies_circuit_open';

    public function check(string $country, string $vat): array
    {
        $normalizedCountry = strtoupper(substr(trim($country), 0, 2));
        $normalizedVat = preg_replace('/[^A-Z0-9]/', '', strtoupper($vat)) ?: '';

        if ($normalizedCountry === '' || $normalizedVat === '') {
            return [
                'valid' => null,
                'message' => __('VAT input is incomplete for VIES.', 'taxid-guard-pro'),
                'source' => 'vies_input_error',
                'error_code' => 'input_error',
            ];
        }

        if ($this->is_circuit_breaker_open()) {
            return [
                'valid' => null,
                'message' => __('VIES is temporarily paused due to repeated failures.', 'taxid-guard-pro'),
                'source' => 'vies_circuit_open',
                'error_code' => 'circuit_open',
            ];
        }

        $cacheKey = self::CACHE_PREFIX . md5($normalizedCountry . ':' . $normalizedVat);
        $cacheTtlHours = max(1, (int) get_option('tg_vies_cache_hours', 24));
        $cached = get_transient($cacheKey);
        if (is_array($cached) && array_key_exists('valid', $cached)) {
            $cached['source'] = 'cache';
            return $cached;
        }

        if (!class_exists('\\SoapClient')) {
            $this->register_failure('soap_missing');
            return [
                'valid' => null,
                'message' => __('SOAP extension is not available.', 'taxid-guard-pro'),
                'source' => 'soap_missing',
                'error_code' => 'soap_missing',
            ];
        }

        $attempt = $this->request_vies($normalizedCountry, $normalizedVat, 1);
        if ($attempt['valid'] === null && $this->is_retryable_error((string) ($attempt['error_code'] ?? ''))) {
            usleep(150000);
            $attempt = $this->request_vies($normalizedCountry, $normalizedVat, 2);
        }

        if ($attempt['valid'] === null) {
            $this->register_failure((string) ($attempt['error_code'] ?? 'vies_error'));
            return $attempt;
        }

        $this->reset_fail_state();

        $cacheValue = [
            'valid' => (bool) $attempt['valid'],
            'message' => '',
            'source' => 'live',
            'error_code' => '',
        ];
        set_transient($cacheKey, $cacheValue, $cacheTtlHours * HOUR_IN_SECONDS);

        return $cacheValue;
    }

    public function is_circuit_breaker_open(): bool
    {
        return (bool) get_transient(self::CIRCUIT_KEY);
    }

    private function request_vies(string $country, string $vat, int $attempt): array
    {
        $timeout = max(2, (int) apply_filters('tg_pro_vies_timeout', 3));

        try {
            $client = new \SoapClient('https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl', [
                'connection_timeout' => $timeout,
                'exceptions' => true,
            ]);
            $response = $client->checkVat([
                'countryCode' => $country,
                'vatNumber' => $vat,
            ]);

            return [
                'valid' => (bool) ($response->valid ?? false),
                'message' => '',
                'source' => 'live',
                'error_code' => '',
                'attempt' => $attempt,
            ];
        } catch (\Throwable $exception) {
            $code = $this->classify_error($exception);
            return [
                'valid' => null,
                'message' => $this->friendly_error_message($code),
                'source' => 'vies_error',
                'error_code' => $code,
                'attempt' => $attempt,
            ];
        }
    }

    private function classify_error(\Throwable $exception): string
    {
        $message = strtolower($exception->getMessage());
        if (strpos($message, 'timed out') !== false || strpos($message, 'timeout') !== false) {
            return 'timeout';
        }
        if (strpos($message, 'http') !== false || strpos($message, 'could not connect') !== false || strpos($message, 'failed to load external entity') !== false) {
            return 'transport_error';
        }
        return 'vies_error';
    }

    private function friendly_error_message(string $code): string
    {
        switch ($code) {
            case 'timeout':
                return __('VIES timed out. Please try again.', 'taxid-guard-pro');
            case 'transport_error':
                return __('VIES is unreachable right now.', 'taxid-guard-pro');
            default:
                return __('VIES returned an unexpected error.', 'taxid-guard-pro');
        }
    }

    private function is_retryable_error(string $code): bool
    {
        return in_array($code, ['timeout', 'transport_error'], true);
    }

    private function register_failure(string $errorCode): void
    {
        $maxFailures = max(1, (int) get_option('tg_vies_circuit_failures', 3));
        $openMinutes = max(1, (int) get_option('tg_vies_circuit_minutes', 10));

        $state = get_transient(self::FAIL_STATE_KEY);
        if (!is_array($state)) {
            $state = ['count' => 0, 'last_error' => ''];
        }

        $state['count'] = (int) ($state['count'] ?? 0) + 1;
        $state['last_error'] = $errorCode;

        set_transient(self::FAIL_STATE_KEY, $state, $openMinutes * MINUTE_IN_SECONDS);

        if ($state['count'] >= $maxFailures) {
            set_transient(self::CIRCUIT_KEY, 1, $openMinutes * MINUTE_IN_SECONDS);
        }
    }

    private function reset_fail_state(): void
    {
        delete_transient(self::FAIL_STATE_KEY);
        delete_transient(self::CIRCUIT_KEY);
    }
}
