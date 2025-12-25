<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminLoginCaptchaTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_requires_captcha_when_enabled(): void
    {
        config()->set('candidboys.security.admin_login_captcha_enabled', true);
        config()->set('candidboys.security.captcha_secret', 'secret');
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 0);

        $response = $this->from('/admin/login')->post('/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['captcha']);
    }

    public function test_admin_login_allows_missing_captcha_when_disabled(): void
    {
        config()->set('candidboys.security.admin_login_captcha_enabled', false);
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

    public function test_admin_login_accepts_valid_captcha_when_enabled(): void
    {
        config()->set('candidboys.security.admin_login_captcha_enabled', true);
        config()->set('candidboys.security.captcha_secret', 'secret');
        config()->set('candidboys.security.admin_login_lockout_max_attempts', 0);

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        $response = $this->post('/admin/login', [
            'email' => $user->email,
            'password' => 'password',
            'captcha' => 'token',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($user);
    }
}
