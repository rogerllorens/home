<?php
declare(strict_types=1);

namespace TaxID_Guard\Pro\Vies;

defined('ABSPATH') || exit;

class ViesService
{
    private const FAILURE_WINDOW = 600;
    private const FAILURE_LIMIT = 3;

    private ViesClientInterface $client;

    public function __construct(?ViesClientInterface $client = null)
    {
        $this->client = $client ?? new ViesClient();
    }

    public function check(string $country, string $vat): array
    {
        $country = strtoupper($country);
        $vat = (string) preg_replace('/[^A-Z0-9]/', '', strtoupper($vat));

        $hash = md5($country . '|' . $vat);
        $cacheKey = "tg_vies_{$hash}";
        $cached = get_transient($cacheKey);
        if (false !== $cached && is_array($cached)) {
            return $cached;
        }

        if ($this->is_circuit_open()) {
            $result = [
                'valid' => null,
                'name' => null,
                'address' => null,
                'error' => __('VIES is temporarily unavailable due to repeated failures.', 'taxid-guard-for-woocommerce'),
                'source' => 'vies_circuit_open',
                'code' => 'TG_VIES_UNAVAILABLE',
            ];
            set_transient($cacheKey, $result, 5 * MINUTE_IN_SECONDS);
            $this->log('warn', 'VIES circuit breaker active');
            return $result;
        }

        $result = $this->client->check($country, $vat);
        if (($result['valid'] ?? null) === null) {
            $retry = $this->client->check($country, $vat);
            if (($retry['valid'] ?? null) !== null) {
                $result = $retry;
            }
        }

        if (($result['valid'] ?? null) === null) {
            $this->record_failure();
            set_transient($cacheKey, $result, 30 * MINUTE_IN_SECONDS);
        } else {
            $this->clear_failures();
            $hours = max(1, (int) get_option('tg_vies_cache_hours', 24));
            set_transient($cacheKey, $result, $hours * HOUR_IN_SECONDS);
        }

        return $result;
    }

    public function evaluate(string $country, string $vat, string $failMode = 'block'): array
    {
        $result = $this->check($country, $vat);

        if (($result['source'] ?? '') === 'vies_circuit_open') {
            return [
                'ok' => $failMode === 'allow',
                'code' => $failMode === 'allow' ? 'TG_VIES_UNAVAILABLE_ALLOWED' : 'TG_VIES_UNAVAILABLE_BLOCKED',
                'result' => $result,
            ];
        }

        if (($result['valid'] ?? null) === true) {
            return ['ok' => true, 'code' => 'TG_VIES_VALID', 'result' => $result];
        }
        if (($result['valid'] ?? null) === false) {
            return ['ok' => false, 'code' => 'TG_VIES_INVALID', 'result' => $result];
        }

        if (($result['source'] ?? '') === 'soap_missing') {
            return [
                'ok' => $failMode === 'allow',
                'code' => 'TG_VIES_SOAP_MISSING',
                'result' => $result,
            ];
        }

        return [
            'ok' => $failMode === 'allow',
            'code' => $failMode === 'allow' ? 'TG_VIES_UNAVAILABLE_ALLOWED' : 'TG_VIES_UNAVAILABLE_BLOCKED',
            'result' => $result,
        ];
    }

    public function is_circuit_breaker_open(): bool
    {
        return $this->is_circuit_open();
    }

    private function is_circuit_open(): bool
    {
        return (bool) get_transient('tg_vies_circuit_open');
    }

    private function record_failure(): void
    {
        $state = get_transient('tg_vies_fail_state');
        if (! is_array($state)) {
            $state = ['count' => 0, 'start' => time()];
        }

        $now = time();
        if (($state['start'] ?? $now) + self::FAILURE_WINDOW < $now) {
            $state = ['count' => 0, 'start' => $now];
        }

        $state['count'] = (int) ($state['count'] ?? 0) + 1;
        set_transient('tg_vies_fail_state', $state, self::FAILURE_WINDOW);

        if ($state['count'] >= self::FAILURE_LIMIT) {
            set_transient('tg_vies_circuit_open', 1, self::FAILURE_WINDOW);
            $this->log('error', 'VIES circuit breaker opened', ['count' => $state['count']]);
        }
    }

    private function clear_failures(): void
    {
        delete_transient('tg_vies_fail_state');
        delete_transient('tg_vies_circuit_open');
    }

    private function log(string $level, string $message, array $context = []): void
    {
        if (! class_exists('TaxID_Guard\\Bootstrap')) {
            return;
        }

        $logger = \TaxID_Guard\Bootstrap::get_logger();
        if (! $logger) {
            return;
        }

        if (method_exists($logger, $level)) {
            $logger->{$level}($message, $context);
        }
    }
}
