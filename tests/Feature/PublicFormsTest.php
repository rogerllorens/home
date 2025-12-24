<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicFormsTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_form_rejects_honeypot(): void
    {
        $response = $this->post(route('public.contact'), [
            'name' => 'Test',
            'email' => 'test@example.com',
            'subject' => 'Hello',
            'message' => 'This is a valid message content.',
            'website' => 'spam',
        ]);

        $response->assertSessionHasErrors('website');
        $this->assertDatabaseCount('public_contact_messages', 0);
    }

    public function test_contact_form_accepts_valid_submission(): void
    {
        $response = $this->post(route('public.contact'), [
            'name' => 'Test',
            'email' => 'test@example.com',
            'subject' => 'Hello',
            'message' => 'This is a valid message content.',
        ]);

        $response->assertSessionHas('status');
        $this->assertDatabaseHas('public_contact_messages', [
            'email' => 'test@example.com',
            'subject' => 'Hello',
        ]);
    }

    public function test_contact_form_rate_limit(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->post(route('public.contact'), [
                'name' => 'Test',
                'email' => "test{$i}@example.com",
                'subject' => 'Hello',
                'message' => 'This is a valid message content.',
            ]);
        }

        $response = $this->post(route('public.contact'), [
            'name' => 'Test',
            'email' => 'test7@example.com',
            'subject' => 'Hello',
            'message' => 'This is a valid message content.',
        ]);

        $response->assertStatus(429);
    }

    public function test_takedown_form_rejects_honeypot(): void
    {
        $response = $this->post(route('public.takedown'), [
            'url' => 'https://example.com/video',
            'email' => 'test@example.com',
            'requester_name' => 'Test',
            'reason' => 'Copyright',
            'website' => 'spam',
        ]);

        $response->assertSessionHasErrors('website');
        $this->assertDatabaseCount('public_takedown_requests', 0);
    }

    public function test_takedown_form_accepts_valid_submission(): void
    {
        $response = $this->post(route('public.takedown'), [
            'url' => 'https://example.com/video',
            'email' => 'test@example.com',
            'requester_name' => 'Test',
            'reason' => 'Copyright',
        ]);

        $response->assertSessionHas('status');
        $this->assertDatabaseHas('public_takedown_requests', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_takedown_form_rate_limit(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->post(route('public.takedown'), [
                'url' => "https://example.com/video{$i}",
                'email' => "test{$i}@example.com",
                'requester_name' => 'Test',
                'reason' => 'Copyright',
            ]);
        }

        $response = $this->post(route('public.takedown'), [
            'url' => 'https://example.com/video99',
            'email' => 'test99@example.com',
            'requester_name' => 'Test',
            'reason' => 'Copyright',
        ]);

        $response->assertStatus(429);
    }
}
