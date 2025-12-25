<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLoginRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_is_rate_limited(): void
    {
        config()->set('candidboys.security.rate_limits.admin_login', '2/min');
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 0);

        $payload = [
            'email' => 'admin@example.com',
            'password' => 'invalid',
        ];

        $this->post('/admin/login', $payload);
        $this->post('/admin/login', $payload);

        $response = $this->post('/admin/login', $payload);

        $response->assertStatus(429);
    }
}
