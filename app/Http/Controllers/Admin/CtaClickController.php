<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cta;
use App\Models\CtaClick;
use App\Models\CtaImpression;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CtaClickController extends Controller
{
    public function index(Request $request): View
    {
        $clicksQuery = CtaClick::query();
        $impressionsQuery = CtaImpression::query();

        $start = $request->date('start');
        $end = $request->date('end');
        if ($start && $end) {
            $clicksQuery->whereBetween('created_at', [$start->startOfDay(), $end->endOfDay()]);
            $impressionsQuery->whereBetween('created_at', [$start->startOfDay(), $end->endOfDay()]);
        }

        $clicksByCta = (clone $clicksQuery)
            ->selectRaw('cta_id, cta_key, count(*) as total')
            ->groupBy('cta_id', 'cta_key')
            ->get()
            ->keyBy('cta_id');

        $impressionsByCta = (clone $impressionsQuery)
            ->selectRaw('cta_id, count(*) as total')
            ->groupBy('cta_id')
            ->get()
            ->keyBy('cta_id');

        $byOriginClicks = (clone $clicksQuery)
            ->selectRaw('origin_page, cta_id, count(*) as total')
            ->groupBy('origin_page', 'cta_id')
            ->orderByDesc('total')
            ->get();

        $byOriginImpressions = (clone $impressionsQuery)
            ->selectRaw('origin_page, cta_id, count(*) as total')
            ->groupBy('origin_page', 'cta_id')
            ->orderByDesc('total')
            ->get();

        $ctaStats = Cta::query()
            ->orderBy('key')
            ->get()
            ->map(function (Cta $cta) use ($clicksByCta, $impressionsByCta) {
                $clicks = (int) ($clicksByCta[$cta->id]->total ?? 0);
                $impressions = (int) ($impressionsByCta[$cta->id]->total ?? 0);
                $ctr = $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0;

                return [
                    'cta' => $cta,
                    'clicks' => $clicks,
                    'impressions' => $impressions,
                    'ctr' => $ctr,
                ];
            });

        $latest = (clone $clicksQuery)
            ->with('cta')
            ->latest()
            ->limit(50)
            ->get();

        return view('admin.cta-clicks.index', [
            'ctaStats' => $ctaStats,
            'byOriginClicks' => $byOriginClicks,
            'byOriginImpressions' => $byOriginImpressions,
            'latest' => $latest,
            'filters' => $request->only(['start', 'end']),
        ]);
    }
}
