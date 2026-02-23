<?php
declare(strict_types=1);

namespace TaxID_Guard\ValueObjects;

final class ValidationResult
{
    public function __construct(
        public bool $ok,
        public string $message = '',
        public string $code = '',
        public string $status = 'valid',
        public string $method = 'unknown',
    ) {
    }
}

