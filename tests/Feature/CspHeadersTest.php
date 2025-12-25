<?php

namespace Tests\Feature;

use Tests\TestCase;

class CspHeadersTest extends TestCase
{
    public function test_csp_headers_present_on_public_response(): void
    {
        $response = $this->get(route('public.home'));

        $response->assertHeader('Content-Security-Policy');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_csp_includes_configured_sources(): void
    {
        config()->set('candidboys.security.global_iframe_allowlist', [
            'player.example.com',
            '*.videos.example.com',
        ]);
        config()->set('candidboys.security.asset_cdn', 'cdn.example.com');

        $response = $this->get(route('public.home'));

        $policy = $response->headers->get('Content-Security-Policy');
        $this->assertNotEmpty($policy);
        $this->assertStringContainsString("default-src 'self'", $policy);
        $this->assertStringContainsString('https://player.example.com', $policy);
        $this->assertStringContainsString('https://*.videos.example.com', $policy);
        $this->assertStringContainsString('https://cdn.example.com', $policy);
    }
}
