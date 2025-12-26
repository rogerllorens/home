<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use Illuminate\View\View;

class AnalyticsController extends Controller
{
    public function index(): View
    {
        $since = now()->subDays(7);

        $topEvents = AnalyticsEvent::query()
            ->selectRaw('event_name, count(*) as total')
            ->where('occurred_at', '>=', $since)
            ->groupBy('event_name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $ctaClicks = AnalyticsEvent::query()
            ->where('event_name', 'cta.click')
            ->where('occurred_at', '>=', $since)
            ->selectRaw("properties->>'cta_label' as label, count(*) as total")
            ->groupBy('label')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $videoPlays = AnalyticsEvent::query()
            ->where('event_name', 'video.play')
            ->where('occurred_at', '>=', $since)
            ->count();

        $videoCompleted = AnalyticsEvent::query()
            ->where('event_name', 'video.completed')
            ->where('occurred_at', '>=', $since)
            ->count();

        return view('admin.analytics.index', [
            'topEvents' => $topEvents,
            'ctaClicks' => $ctaClicks,
            'videoPlays' => $videoPlays,
            'videoCompleted' => $videoCompleted,
        ]);
    }
}
