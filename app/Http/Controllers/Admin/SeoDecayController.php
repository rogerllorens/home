<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoPageMetric;
use App\Services\Seo\SeoDecayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SeoDecayController extends Controller
{
    public function index(Request $request): View
    {
        $metrics = SeoPageMetric::query()
            ->where('is_stale', true)
            ->orderByDesc('views_previous')
            ->get();

        return view('admin.seo-decay.index', [
            'metrics' => $metrics,
        ]);
    }

    public function refresh(SeoPageMetric $metric, SeoDecayService $service): RedirectResponse
    {
        $service->refresh($metric);

        return back()->with('status', 'Página refrescada.');
    }
}
