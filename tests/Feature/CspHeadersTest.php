<?php

namespace Tests\Feature;

use Tests\TestCase;

class CspHeadersTest extends TestCase
{
    public function test_csp_headers_present_on_public_response(): void
    {
        $response = $this->get(route('public.home'));

        $response->assertHeader('Content-Security-Policy');
        $response->assertHeader('Strict-Transport-Security');
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
        config()->set('candidboys.security.captcha_enabled', true);
        config()->set('candidboys.security.captcha_hosts', ['www.google.com', 'www.gstatic.com']);
        config()->set('candidboys.security.analytics_hosts', ['analytics.example.com']);
        config()->set('candidboys.security.csp', [
            'img' => ['images.example.com'],
            'script' => ['scripts.example.com'],
            'style' => ['styles.example.com'],
            'connect' => ['api.example.com'],
            'frame' => ['frames.example.com'],
            'child' => ['child.example.com'],
            'allow_unsafe_inline_styles' => true,
        ]);

        $response = $this->get(route('public.home'));

        $policy = $response->headers->get('Content-Security-Policy');
        $this->assertNotEmpty($policy);
        $this->assertStringContainsString("default-src 'self'", $policy);
        $this->assertStringNotContainsString("style-src 'self' 'unsafe-inline'", $policy);
        $this->assertStringContainsString('https://player.example.com', $policy);
        $this->assertStringContainsString('https://*.videos.example.com', $policy);
        $this->assertStringContainsString('https://cdn.example.com', $policy);
        $this->assertStringContainsString('https://www.google.com', $policy);
        $this->assertStringContainsString('https://www.gstatic.com', $policy);
        $this->assertStringContainsString('https://analytics.example.com', $policy);
        $this->assertStringContainsString('https://images.example.com', $policy);
        $this->assertStringContainsString('https://scripts.example.com', $policy);
        $this->assertStringContainsString('https://styles.example.com', $policy);
        $this->assertStringContainsString("style-src 'self' 'unsafe-inline'", $policy);
        $this->assertStringContainsString('https://api.example.com', $policy);
        $this->assertStringContainsString('https://frames.example.com', $policy);
        $this->assertStringContainsString('https://child.example.com', $policy);
    }
}
