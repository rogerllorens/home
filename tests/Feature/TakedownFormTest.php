<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TakedownFormTest extends TestCase
{
    use RefreshDatabase;

    public function test_takedown_form_submits_when_captcha_disabled(): void
    {
        config()->set('candidboys.security.captcha_enabled', false);

        $response = $this->post(route('public.takedown'), [
            'url' => 'https://example.com/video',
            'email' => 'user@example.com',
            'requester_name' => 'Test User',
            'reason' => 'Ownership reason',
            'notes' => 'Additional info',
            'website' => '',
        ]);

        $response->assertSessionHas('status');
    }

    public function test_takedown_form_requires_captcha_when_enabled(): void
    {
        config()->set('candidboys.security.captcha_enabled', true);
        config()->set('candidboys.security.captcha_secret', 'secret');

        $response = $this->post(route('public.takedown'), [
            'url' => 'https://example.com/video',
            'email' => 'user@example.com',
            'requester_name' => 'Test User',
            'reason' => 'Ownership reason',
            'notes' => 'Additional info',
            'website' => '',
        ]);

        $response->assertSessionHasErrors(['captcha']);
    }

    public function test_takedown_form_accepts_valid_captcha(): void
    {
        config()->set('candidboys.security.captcha_enabled', true);
        config()->set('candidboys.security.captcha_secret', 'secret');

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        $response = $this->post(route('public.takedown'), [
            'url' => 'https://example.com/video',
            'email' => 'user@example.com',
            'requester_name' => 'Test User',
            'reason' => 'Ownership reason',
            'notes' => 'Additional info',
            'captcha' => 'token',
            'website' => '',
        ]);

        $response->assertSessionHas('status');
    }

    public function test_takedown_form_rate_limit_triggers(): void
    {
        config()->set('candidboys.security.rate_limits.public_takedown', '1/min');
        config()->set('candidboys.security.captcha_enabled', false);

        $payload = [
            'url' => 'https://example.com/video',
            'email' => 'user@example.com',
            'requester_name' => 'Test User',
            'reason' => 'Ownership reason',
            'notes' => 'Additional info',
            'website' => '',
        ];

        $this->post(route('public.takedown'), $payload);
        $response = $this->post(route('public.takedown'), $payload);

        $response->assertStatus(429);
    }
}
