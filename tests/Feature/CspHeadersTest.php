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
    }
}
