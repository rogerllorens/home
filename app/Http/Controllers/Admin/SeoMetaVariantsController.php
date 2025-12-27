<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoMetaVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class SeoMetaVariantsController extends Controller
{
    public function index(Request $request): View
    {
        $pageType = $request->string('page_type')->toString();

        $variants = SeoMetaVariant::query()
            ->when($pageType !== '', fn ($query) => $query->where('page_type', $pageType))
            ->orderBy('page_type')
            ->orderByDesc('is_winner')
            ->get();

        $stats = DB::table('seo_meta_variant_logs')
            ->select('seo_meta_variant_id', DB::raw('count(*) as total'), DB::raw('sum(case when is_organic then 1 else 0 end) as organic'))
            ->groupBy('seo_meta_variant_id')
            ->pluck('total', 'seo_meta_variant_id')
            ->all();

        $organicStats = DB::table('seo_meta_variant_logs')
            ->select('seo_meta_variant_id', DB::raw('sum(case when is_organic then 1 else 0 end) as organic'))
            ->groupBy('seo_meta_variant_id')
            ->pluck('organic', 'seo_meta_variant_id')
            ->all();

        return view('admin.seo-meta-variants.index', [
            'variants' => $variants,
            'stats' => $stats,
            'organicStats' => $organicStats,
            'pageType' => $pageType,
        ]);
    }

    public function markWinner(SeoMetaVariant $variant): RedirectResponse
    {
        SeoMetaVariant::query()
            ->where('page_type', $variant->page_type)
            ->when($variant->page_id !== null, fn ($query) => $query->where('page_id', $variant->page_id))
            ->update(['is_winner' => false]);

        $variant->update(['is_winner' => true]);

        return back()->with('status', 'Variante ganadora fijada.');
    }
}
