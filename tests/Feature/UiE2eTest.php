<?php

namespace Tests\Feature;

use Tests\TestCase;

class UiE2eTest extends TestCase
{
    public function test_pagination_and_sort_chips_require_browser_stack(): void
    {
        if (!env('RUN_E2E_TESTS')) {
            $this->markTestSkipped('E2E UI checks require a browser stack (Dusk/Playwright).');
        }

        $this->markTestSkipped('Implement with Laravel Dusk or Playwright once available.');
    }
}
