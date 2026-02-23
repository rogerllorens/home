<?php
declare(strict_types=1);

namespace TaxID_Guard\Pro\Rules;

use TaxID_Guard\ValueObjects\TaxIdInput;

final class ProRules
{
    public static function shouldRequire(TaxIdInput $input, ProContext $ctx, ProSettings $settings): bool
    {
        if ($settings->excludeVirtualOrders && $ctx->isVirtualOrder) {
            return false;
        }

        if ($settings->excludePaymentMethods && $ctx->paymentMethodId !== null && in_array($ctx->paymentMethodId, $settings->excludePaymentMethods, true)) {
            return false;
        }

        if ($settings->excludeShippingMethods && array_intersect($ctx->shippingMethodIds, $settings->excludeShippingMethods)) {
            return false;
        }

        if ($settings->requiredRoles && ! array_intersect($ctx->roles, $settings->requiredRoles)) {
            return false;
        }

        if ($settings->requiredCountries && ! in_array(strtoupper($input->country), array_map('strtoupper', $settings->requiredCountries), true)) {
            return false;
        }

        if ($settings->minCartTotal > 0 && $ctx->cartTotal < $settings->minCartTotal) {
            return false;
        }

        return true;
    }
}
