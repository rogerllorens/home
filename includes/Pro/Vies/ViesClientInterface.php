<?php
declare(strict_types=1);

namespace TaxID_Guard\Pro\Vies;

interface ViesClientInterface
{
    public function check(string $country, string $vat): array;
}
