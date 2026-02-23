<?php
declare(strict_types=1);

namespace TaxID_Guard\Utils;

defined('ABSPATH') || exit;

class Logger
{
    private $logger;

    public function __construct()
    {
        $this->logger = function_exists('wc_get_logger') ? wc_get_logger() : null;
    }

    public function debug(string $message, array $context = []): void { $this->write('debug', $message, $context); }
    public function info(string $message, array $context = []): void { $this->write('info', $message, $context); }
    public function warn(string $message, array $context = []): void { $this->write('warning', $message, $context); }
    public function error(string $message, array $context = []): void { $this->write('error', $message, $context); }

    private function write(string $level, string $message, array $context = []): void
    {
        $context = array_merge(['source' => 'taxid-guard'], $context);
        if ($this->logger && method_exists($this->logger, $level)) {
            $this->logger->{$level}($message, $context);
            return;
        }
        error_log('[TaxID Guard][' . strtoupper($level) . '] ' . $message . ' ' . wp_json_encode($context));
    }
}
