<?php

namespace Tests\Feature;

use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_is_rate_limited(): void
    {
        config()->set('candidboys.security.rate_limits.search', 1);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.10'])
            ->get(route('public.search', ['q' => 'test']));

        $response->assertOk();

        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.10'])
            ->get(route('public.search', ['q' => 'test']))
            ->assertStatus(429);
    }

    public function test_admin_login_is_rate_limited(): void
    {
        config()->set('candidboys.security.rate_limits.admin_login', 1);

        $payload = ['email' => 'admin@example.com', 'password' => 'secret'];

        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.11'])
            ->post(route('admin.login'), $payload)
            ->assertStatus(302);

        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.11'])
            ->post(route('admin.login'), $payload)
            ->assertStatus(429);
    }

    public function test_public_contact_is_rate_limited(): void
    {
        config()->set('candidboys.security.rate_limits.public_contact', 1);

        $payload = [
            'name' => 'Test User',
            'email' => 'user@example.com',
            'subject' => 'Hello',
            'message' => str_repeat('Message ', 3),
            'website' => '',
        ];

        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.12'])
            ->post(route('public.contact'), $payload)
            ->assertStatus(302);

        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.12'])
            ->post(route('public.contact'), $payload)
            ->assertStatus(429);
    }

    public function test_public_takedown_is_rate_limited(): void
    {
        config()->set('candidboys.security.rate_limits.public_takedown', 1);

        $payload = [
            'url' => 'https://example.com/video/123',
            'email' => 'user@example.com',
            'requester_name' => 'Test User',
            'reason' => 'DMCA',
            'notes' => 'Test notes',
            'website' => '',
        ];

        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.13'])
            ->post(route('public.takedown'), $payload)
            ->assertStatus(302);

        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.13'])
            ->post(route('public.takedown'), $payload)
            ->assertStatus(429);
    }

    public function test_video_events_are_rate_limited(): void
    {
        config()->set('candidboys.security.rate_limits.video_events', 1);

        $video = Video::factory()->create();

        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.14'])
            ->get(route('public.video.events', [
                'video_id' => $video->id,
                'event' => 'play',
                'value' => '1',
            ]))
            ->assertStatus(204);

        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.14'])
            ->get(route('public.video.events', [
                'video_id' => $video->id,
                'event' => 'play',
                'value' => '1',
            ]))
            ->assertStatus(429);
    }
}
