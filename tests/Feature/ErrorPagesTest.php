<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    public function test_missing_route_renders_custom_404_page(): void
    {
        $this->get('/this-route-does-not-exist')
            ->assertStatus(404)
            ->assertViewIs('errors.404');
    }

    public function test_exception_renders_custom_500_page(): void
    {
        Route::get('/__test-error', function () {
            throw new \RuntimeException('Forced error');
        });

        $this->get('/__test-error')
            ->assertStatus(500)
            ->assertViewIs('errors.500');
    }
}
