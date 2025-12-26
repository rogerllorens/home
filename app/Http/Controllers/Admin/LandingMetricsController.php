<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingPageview;
use App\Models\SearchLanding;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class LandingMetricsController extends Controller
{
    public function index(): View
    {
        $currentCutoff = now()->subDays(30);
        $previousCutoff = now()->subDays(60);

        $currentViews = LandingPageview::query()
            ->select('search_landing_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $currentCutoff)
            ->groupBy('search_landing_id')
            ->pluck('total', 'search_landing_id');

        $previousViews = LandingPageview::query()
            ->select('search_landing_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $previousCutoff)
            ->where('viewed_at', '<', $currentCutoff)
            ->groupBy('search_landing_id')
            ->pluck('total', 'search_landing_id');

        $metrics = SearchLanding::query()
            ->where('is_public', true)
            ->get()
            ->map(function (SearchLanding $landing) use ($currentViews, $previousViews) {
                $current = (int) ($currentViews[$landing->id] ?? 0);
                $previous = (int) ($previousViews[$landing->id] ?? 0);
                $delta = $current - $previous;

                return (object) [
                    'landing' => $landing,
                    'current' => $current,
                    'previous' => $previous,
                    'delta' => $delta,
                ];
            });

        return view('admin.landing-metrics.index', [
            'rising' => $this->topRising($metrics),
            'declining' => $this->topDeclining($metrics),
            'dormant' => $this->topDormant($metrics),
        ]);
    }

    private function topRising(Collection $metrics): Collection
    {
        return $metrics
            ->filter(fn ($row) => $row->current > 0 && $row->delta > 0)
            ->sortByDesc('delta')
            ->take(10)
            ->values();
    }

    private function topDeclining(Collection $metrics): Collection
    {
        return $metrics
            ->filter(fn ($row) => $row->previous > 0 && $row->delta < 0)
            ->sortBy('delta')
            ->take(10)
            ->values();
    }

    private function topDormant(Collection $metrics): Collection
    {
        return $metrics
            ->filter(fn ($row) => $row->current === 0)
            ->sortByDesc(fn ($row) => $row->previous)
            ->take(10)
            ->values();
    }
}
