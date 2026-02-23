<?php
declare(strict_types=1);

namespace TaxID_Guard\ValueObjects;

final class TaxIdInput
{
    public function __construct(
        public bool $isCompany,
        public string $taxId,
        public string $country,
    ) {
    }
}

