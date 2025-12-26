<?php

namespace Tests\Feature;

use App\Models\AnalyticsEvent;
use App\Support\DeviceHash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_tracking_endpoint_stores_event(): void
    {
        $deviceHash = 'device-hash-track';

        $response = $this->withCookie(DeviceHash::cookieName(), $deviceHash)
            ->postJson(route('public.events.track'), [
                'event' => 'search.submit',
                'properties' => [
                    'query' => 'test',
                    'context' => 'search_page',
                ],
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('analytics_events', [
            'event_name' => 'search.submit',
            'device_hash' => $deviceHash,
        ]);
    }
}
