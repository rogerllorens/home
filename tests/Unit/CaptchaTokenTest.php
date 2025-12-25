<?php

namespace Tests\Unit;

use App\Rules\CaptchaToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class CaptchaTokenTest extends TestCase
{
    public function test_disabled_captcha_always_passes(): void
    {
        $rule = new CaptchaToken(false);

        $this->assertTrue($rule->passes('captcha', null));
        $this->assertTrue($rule->passes('captcha', 'token'));
    }

    public function test_enabled_captcha_passes_on_success(): void
    {
        config()->set('candidboys.security.captcha_secret', 'secret');

        Http::fake([
            '*' => Http::response(['success' => true], 200),
        ]);

        $rule = new CaptchaToken(true);

        $this->assertTrue($rule->passes('captcha', 'token'));
    }

    public function test_enabled_captcha_fails_on_provider_failure(): void
    {
        config()->set('candidboys.security.captcha_secret', 'secret');

        Http::fake([
            '*' => Http::response(['success' => false], 200),
        ]);

        $rule = new CaptchaToken(true);

        $this->assertFalse($rule->passes('captcha', 'token'));
    }

    public function test_enabled_captcha_fails_on_network_error(): void
    {
        config()->set('candidboys.security.captcha_secret', 'secret');

        Log::spy();

        Http::fake(function () {
            throw new \RuntimeException('Network error');
        });

        $rule = new CaptchaToken(true);

        $this->assertFalse($rule->passes('captcha', 'token'));
        Log::shouldHaveReceived('warning')->once();
    }
}
