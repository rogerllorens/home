<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_query_count_is_reasonable(): void
    {
        Cache::flush();

        Video::factory()->count(5)->create([
            'status' => VideoStatus::Published,
        ]);

        DB::enableQueryLog();
        $response = $this->get(route('public.home'));
        $response->assertOk();

        $queryCount = count(DB::getQueryLog());
        $this->assertLessThan(40, $queryCount, 'Home page query count is too high.');
    }
}
