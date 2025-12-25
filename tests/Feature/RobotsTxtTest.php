<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class RobotsTxtTest extends TestCase
{
    public function test_robots_txt_includes_sitemap(): void
    {
        $contents = File::get(public_path('robots.txt'));

        $this->assertStringContainsString('Sitemap:', $contents);
    }
}
