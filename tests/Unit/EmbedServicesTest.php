<?php

namespace Tests\Unit;

use App\Services\Embeds\EmbedSanitizer;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use Tests\TestCase;

class EmbedServicesTest extends TestCase
{
    public function test_canonicalizer_removes_utm_params(): void
    {
        $canonicalizer = new EmbedUrlCanonicalizer();
        $url = 'https://example.com/embed/123?utm_source=test&ref=abc';

        $this->assertSame('https://example.com/embed/123?ref=abc', $canonicalizer->canonicalize($url));
    }

    public function test_canonicalizer_rejects_http_by_default(): void
    {
        $canonicalizer = new EmbedUrlCanonicalizer();

        $this->assertNull($canonicalizer->canonicalize('http://example.com/embed/123'));
    }

    public function test_sanitizer_strips_disallowed_html(): void
    {
        $sanitizer = new EmbedSanitizer();
        $html = '<script>alert(1)</script><iframe src="https://player.example.com/embed/1"></iframe>';

        $clean = $sanitizer->sanitize($html);

        $this->assertStringNotContainsString('<script>', $clean);
        $this->assertStringContainsString('iframe', $clean);
    }
}
