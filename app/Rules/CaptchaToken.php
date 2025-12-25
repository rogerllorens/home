<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class CaptchaToken implements Rule
{
    public function __construct(private readonly ?bool $enabled = null)
    {
    }

    public function passes($attribute, $value): bool
    {
        $enabled = $this->enabled ?? (bool) config('candidboys.security.captcha_enabled');

        if (!$enabled) {
            return true;
        }

        $secret = config('candidboys.security.captcha_secret');
        if (!$secret || !is_string($value) || $value === '') {
            return false;
        }

        $verifyUrl = config('candidboys.security.captcha_verify_url');

        try {
            $response = Http::asForm()->post($verifyUrl, [
                'secret' => $secret,
                'response' => $value,
                'remoteip' => request()->ip(),
            ]);
        } catch (\Throwable $exception) {
            Log::warning('Captcha verification failed', [
                'error' => $exception->getMessage(),
            ]);
            return false;
        }

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
