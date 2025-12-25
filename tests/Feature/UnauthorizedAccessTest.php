<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UnauthorizedAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_blocked_from_admin_routes(): void
    {
        $response = $this->get(route('admin.videos.index'));

        $response->assertRedirect(route('admin.login'));
    }

    public function test_non_admin_blocked_from_admin_routes(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user)->get(route('admin.videos.index'));

        $response->assertForbidden();
    }
}
