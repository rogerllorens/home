<?php

namespace Tests\Feature;

use Tests\TestCase;

class CsrfProtectionTest extends TestCase
{
    public function test_post_without_csrf_token_is_rejected(): void
    {
        config()->set('candidboys.security.csrf_enforce_testing', true);

        $response = $this->post(route('public.contact'), [
            'name' => 'User',
            'email' => 'user@example.com',
            'subject' => 'Hello',
            'message' => 'This is a message with enough length.',
        ]);

        $response->assertStatus(419);
    }
}
