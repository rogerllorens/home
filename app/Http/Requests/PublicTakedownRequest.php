<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicTakedownRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'url' => ['required', 'url', 'max:500'],
            'email' => ['required', 'email', 'max:190'],
            'requester_name' => ['nullable', 'string', 'max:120'],
            'reason' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'website' => ['nullable', 'size:0'],
        ];
    }
}
