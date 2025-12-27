<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Favorite;
use App\Models\Video;
use App\Models\VideoViewHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class HomePersonalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_without_history_uses_generic_sections(): void
    {
        Cache::flush();
        app()->setLocale('en');

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->withCookie('device_id', 'device-empty')
            ->get(route('public.home', ['locale' => 'en']));

        $response->assertOk();
        $response->assertSee(__('ui.home.recently_added'));
        $response->assertDontSee(__('ui.home.for_you_label'));
    }

    public function test_home_with_history_builds_personalized_sections(): void
    {
        Cache::flush();
        app()->setLocale('en');

        $deviceHash = 'device-personalized';

        $watched = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
            'raw_tags' => ['cozy', 'soft'],
            'published_at' => now()->subDays(3),
        ]);

        $favorite = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
            'raw_tags' => ['cozy'],
            'published_at' => now()->subDays(2),
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
            'raw_tags' => ['love'],
            'published_at' => now()->subDay(),
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'playful',
            'raw_tags' => ['cozy'],
            'published_at' => now()->subHours(6),
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $watched->id,
            'last_watched_at' => now()->subHour(),
        ]);

        Favorite::create([
            'device_hash' => $deviceHash,
            'video_id' => $favorite->id,
        ]);

        $response = $this->withCookie('device_id', $deviceHash)
            ->get(route('public.home', ['locale' => 'en']));

        $response->assertOk();
        $response->assertSee(__('ui.home.for_you_label'));
        $response->assertSee(__('ui.home.continue_title'));
        $response->assertSee(__('ui.home.favorites_title'));
        $response->assertSee(__('ui.home.because_you_liked', ['topic' => Str::headline('romantic')]));
        $response->assertSee(__('ui.home.because_you_liked', ['topic' => '#cozy']));
    }
}
