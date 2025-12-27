<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected function runningUnitTests(): bool
    {
        if (config('candidboys.security.csrf_enforce_testing', false)) {
            return false;
        }

        return parent::runningUnitTests();
    }
}
