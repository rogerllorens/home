<?php
declare(strict_types=1);

namespace TaxID_Guard\Pro\Rules;

final class ProContext
{
    public function __construct(
        public array $roles = [],
        public float $cartTotal = 0.0,
        public ?string $paymentMethodId = null,
        public array $shippingMethodIds = [],
        public bool $isVirtualOrder = false,
        public string $billingCountry = ''
    ) {
    }
}
