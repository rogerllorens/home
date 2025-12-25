<?php

namespace App\Http\Requests;

use App\Rules\CaptchaToken;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $captchaEnabled = (bool) config('candidboys.security.admin_login_captcha_enabled');

        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'captcha' => [
                Rule::requiredIf($captchaEnabled),
                'string',
                'max:200',
                new CaptchaToken($captchaEnabled),
            ],
        ];
    }
}
