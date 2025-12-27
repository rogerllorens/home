<?php

namespace Tests\Unit;

use App\Models\AnalyticsEvent;
use App\Services\Analytics\TrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class TrackingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_tracking_service_persists_event(): void
    {
        $service = app(TrackingService::class);
        $request = Request::create('/en/test', 'GET', [], [
            'device_id' => 'device-hash',
        ]);
        $request->headers->set('referer', '/en');

        $event = $service->track('video.play', ['video_id' => 123], $request);

        $this->assertInstanceOf(AnalyticsEvent::class, $event);
        $this->assertDatabaseHas('analytics_events', [
            'event_name' => 'video.play',
            'device_hash' => 'device-hash',
        ]);
    }
}
