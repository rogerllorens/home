<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PublicContactRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'subject' => ['nullable', 'string', 'max:190'],
            'message' => ['required', 'string', 'min:20', 'max:2000'],
            'website' => ['nullable', 'size:0'],
            'captcha' => [Rule::requiredIf((bool) config('candidboys.security.captcha_enabled')), 'string', 'max:200'],
        ];
    }
}
