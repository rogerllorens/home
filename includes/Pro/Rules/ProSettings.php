<?php
declare(strict_types=1);

namespace TaxID_Guard\Pro\Rules;

final class ProSettings
{
    public function __construct(
        public array $requiredRoles = [],
        public array $requiredCountries = [],
        public float $minCartTotal = 0.0,
        public array $excludePaymentMethods = [],
        public array $excludeShippingMethods = [],
        public bool $excludeVirtualOrders = false
    ) {
    }
}
