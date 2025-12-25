<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_success(): void
    {
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 0);

        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        $response = $this->post('/admin/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_admin_login_fails_with_invalid_credentials(): void
    {
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 0);

        $response = $this->post('/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'invalid',
        ]);

        $response->assertSessionHasErrors(['email']);
    }
}
