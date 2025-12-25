<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\Http;

class CaptchaToken implements Rule
{
    public function passes($attribute, $value): bool
    {
        if (!config('candidboys.security.captcha_enabled')) {
            return true;
        }

        $secret = config('candidboys.security.captcha_secret');
        if (!$secret || !is_string($value) || $value === '') {
            return false;
        }

        $verifyUrl = config('candidboys.security.captcha_verify_url');

        $response = Http::asForm()->post($verifyUrl, [
            'secret' => $secret,
            'response' => $value,
            'remoteip' => request()->ip(),
        ]);

        if (!$response->ok()) {
            return false;
        }

        $payload = $response->json();

        return (bool) ($payload['success'] ?? false);
    }

    public function message(): string
    {
        return 'Captcha inválido.';
    }
}
