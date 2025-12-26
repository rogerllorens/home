<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryPageview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function index(Request $request): View
    {
        $onlyAuto = $request->boolean('auto_managed');
        $cutoff = now()->subDays(30);

        $views = CategoryPageview::query()
            ->select('category_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        $categories = Category::query()
            ->when($onlyAuto, fn ($query) => $query->where('is_auto_managed', true))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return view('admin.categories.index', [
            'categories' => $categories,
            'onlyAuto' => $onlyAuto,
            'views' => $views,
        ]);
    }
}
