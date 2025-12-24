<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CtaClick;
use Illuminate\View\View;

class CtaClickController extends Controller
{
    public function index(): View
    {
        $summary = CtaClick::query()
            ->selectRaw('cta_key, count(*) as total')
            ->groupBy('cta_key')
            ->orderByDesc('total')
            ->get();

        $byCategory = CtaClick::query()
            ->selectRaw('category_slug, cta_key, count(*) as total')
            ->groupBy('category_slug', 'cta_key')
            ->orderByDesc('total')
            ->get();

        $latest = CtaClick::query()
            ->latest()
            ->limit(50)
            ->get();

        return view('admin.cta-clicks.index', compact('summary', 'byCategory', 'latest'));
    }
}
