<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SearchLanding;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LandingMetricsListController extends Controller
{
    public function index(Request $request): View
    {
        $filter = $request->string('filter')->trim()->toString();
        $query = SearchLanding::query();

        $query = match ($filter) {
            'dormant' => $query->where('pageviews_last_30d', '<=', 2),
            'lowest' => $query->orderBy('pageviews_last_30d'),
            default => $query->orderByDesc('pageviews_last_30d'),
        };

        $landings = $query->paginate(50)->withQueryString();

        return view('admin.metrics.landings', [
            'landings' => $landings,
            'filter' => $filter,
        ]);
    }
}
