<?php

namespace Tests\Unit;

use Illuminate\Support\Carbon;
use Tests\TestCase;

class HelpersTest extends TestCase
{
    public function test_format_views_formats_large_values(): void
    {
        $this->assertSame('950', format_views(950));
        $this->assertSame('1K', format_views(1000));
        $this->assertSame('1.2K', format_views(1200));
        $this->assertSame('12K', format_views(12000));
        $this->assertSame('1M', format_views(1_000_000));
    }

    public function test_time_ago_returns_human_readable_string(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 00:02:00'));

        $result = time_ago(Carbon::parse('2024-01-01 00:01:00'));

        $this->assertStringContainsString('minute', $result);

        Carbon::setTestNow();
    }
}
