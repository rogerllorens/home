<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLoginLockoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_is_locked_after_too_many_failures(): void
    {
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 2);
        config()->set('candidboys.security.admin_login_lockout_minutes', 5);
        config()->set('candidboys.security.rate_limits.admin_login', '1000/min');

        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        $payload = [
            'email' => $user->email,
            'password' => 'wrong-password',
        ];

        $this->post('/admin/login', $payload);
        $this->post('/admin/login', $payload);

        $lockedResponse = $this->post('/admin/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $lockedResponse->assertStatus(429);
    }

    public function test_admin_login_unlocks_after_cooldown(): void
    {
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 1);
        config()->set('candidboys.security.admin_login_lockout_minutes', 5);
        config()->set('candidboys.security.rate_limits.admin_login', '1000/min');

        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        $this->post('/admin/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $blocked = $this->post('/admin/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $blocked->assertStatus(429);

        $this->travel(6)->minutes();

        $response = $this->post('/admin/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($user);
    }
}
