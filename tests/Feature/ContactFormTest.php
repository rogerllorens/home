<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_form_submits_when_captcha_disabled(): void
    {
        config()->set('candidboys.security.captcha_enabled', false);

        $response = $this->post(route('public.contact'), [
            'name' => 'Test User',
            'email' => 'user@example.com',
            'subject' => 'Hello',
            'message' => 'This is a message with enough length.',
            'website' => '',
        ]);

        $response->assertSessionHas('status');
    }

    public function test_contact_form_requires_captcha_when_enabled(): void
    {
        config()->set('candidboys.security.captcha_enabled', true);
        config()->set('candidboys.security.captcha_secret', 'secret');

        $response = $this->post(route('public.contact'), [
            'name' => 'Test User',
            'email' => 'user@example.com',
            'subject' => 'Hello',
            'message' => 'This is a message with enough length.',
            'website' => '',
        ]);

        $response->assertSessionHasErrors(['captcha']);
    }

    public function test_contact_form_accepts_valid_captcha(): void
    {
        config()->set('candidboys.security.captcha_enabled', true);
        config()->set('candidboys.security.captcha_secret', 'secret');

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        $response = $this->post(route('public.contact'), [
            'name' => 'Test User',
            'email' => 'user@example.com',
            'subject' => 'Hello',
            'message' => 'This is a message with enough length.',
            'captcha' => 'token',
            'website' => '',
        ]);

        $response->assertSessionHas('status');
    }

    public function test_contact_form_rate_limit_triggers(): void
    {
        config()->set('candidboys.security.rate_limits.public_contact', '1/min');
        config()->set('candidboys.security.captcha_enabled', false);

        $payload = [
            'name' => 'Test User',
            'email' => 'user@example.com',
            'subject' => 'Hello',
            'message' => 'This is a message with enough length.',
            'website' => '',
        ];

        $this->post(route('public.contact'), $payload);
        $response = $this->post(route('public.contact'), $payload);

        $response->assertStatus(429);
    }
}
