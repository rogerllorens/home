<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CtaClick;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CtaClickController extends Controller
{
    public function index(Request $request): View
    {
        $query = CtaClick::query();

        $start = $request->date('start');
        $end = $request->date('end');
        if ($start && $end) {
            $query->whereBetween('created_at', [$start->startOfDay(), $end->endOfDay()]);
        }

        $summary = (clone $query)
            ->selectRaw('cta_key, count(*) as total')
            ->groupBy('cta_key')
            ->orderByDesc('total')
            ->get();

        $byCategory = (clone $query)
            ->selectRaw('category_slug, cta_key, count(*) as total')
            ->groupBy('category_slug', 'cta_key')
            ->orderByDesc('total')
            ->get();

        $latest = (clone $query)
            ->latest()
            ->limit(50)
            ->get();

        return view('admin.cta-clicks.index', [
            'summary' => $summary,
            'byCategory' => $byCategory,
            'latest' => $latest,
            'filters' => $request->only(['start', 'end']),
        ]);
    }
}
