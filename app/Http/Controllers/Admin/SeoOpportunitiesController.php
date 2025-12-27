<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SearchQueryAction;
use App\Models\SeoLanding;
use App\Models\TopicCluster;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class SeoOpportunitiesController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->string('status')->toString();

        $queries = DB::table('search_queries')
            ->selectRaw('normalized_query, max(query) as query, count(*) as total, avg(results_count) as avg_results, max(created_at) as last_seen')
            ->groupBy('normalized_query')
            ->orderByDesc('total')
            ->when($status !== '', function ($query) use ($status) {
                $query->join('search_query_actions', 'search_query_actions.normalized_query', '=', 'search_queries.normalized_query')
                    ->where('search_query_actions.status', $status);
            })
            ->limit(200)
            ->get();

        $actions = SearchQueryAction::query()
            ->whereIn('normalized_query', $queries->pluck('normalized_query'))
            ->get()
            ->keyBy('normalized_query');

        $categories = Category::query()
            ->where('is_public', true)
            ->orderBy('name')
            ->get(['slug', 'name']);

        return view('admin.seo-opportunities.index', [
            'queries' => $queries,
            'actions' => $actions,
            'categories' => $categories,
            'durations' => config('seo_landings.durations', []),
            'timeframes' => config('seo_landings.timeframes', []),
            'status' => $status,
        ]);
    }

    public function mark(string $normalizedQuery, Request $request): RedirectResponse
    {
        $status = $request->string('status')->toString();

        if (!in_array($status, ['converted', 'ignored'], true)) {
            return back()->with('status', 'Estado no válido.');
        }

        SearchQueryAction::updateOrCreate(
            ['normalized_query' => $normalizedQuery],
            ['status' => $status]
        );

        return back()->with('status', 'Estado actualizado.');
    }

    public function createLanding(string $normalizedQuery, Request $request): RedirectResponse
    {
        $category = $request->string('category')->toString();
        $duration = $request->string('duration')->toString();

        $params = array_filter([
            'category' => $category ?: null,
            'tag' => $normalizedQuery,
            'duration' => $duration ?: null,
        ]);

        $slugParts = array_filter([$category, $normalizedQuery, $duration]);
        $slug = collect($slugParts)
            ->map(fn ($part) => Str::slug($part))
            ->implode('-');

        $landing = SeoLanding::firstOrCreate([
            'slug' => $slug,
        ], [
            'type' => 'discover',
            'params' => $params,
            'title_template' => 'Videos {duration} de {category} y {tag}',
            'description_template' => 'Encuentra videos {duration} relacionados con {category} y {tag}.',
            'language' => $request->string('language')->toString() ?: 'es',
        ]);

        SearchQueryAction::updateOrCreate(
            ['normalized_query' => $normalizedQuery],
            ['status' => 'converted']
        );

        return redirect()
            ->route('public.discover', $landing->slug)
            ->with('status', 'Landing SEO creada.');
    }

    public function createTagLanding(string $normalizedQuery): RedirectResponse
    {
        $slug = 'tag-' . Str::slug($normalizedQuery);

        $landing = SeoLanding::firstOrCreate([
            'slug' => $slug,
        ], [
            'type' => 'discover',
            'params' => [
                'tag' => $normalizedQuery,
            ],
            'title_template' => 'Videos destacados sobre {tag}',
            'description_template' => 'Explora videos relacionados con {tag} y descubre nuevos favoritos.',
            'language' => 'es',
        ]);

        SearchQueryAction::updateOrCreate(
            ['normalized_query' => $normalizedQuery],
            ['status' => 'converted']
        );

        return redirect()
            ->route('public.discover', $landing->slug)
            ->with('status', 'Landing de tag creada.');
    }

    public function createCluster(string $normalizedQuery): RedirectResponse
    {
        $slug = Str::slug($normalizedQuery);
        $name = Str::headline($normalizedQuery);

        TopicCluster::firstOrCreate([
            'slug' => $slug,
        ], [
            'name' => $name,
            'h1' => "Todo sobre {$name}",
            'h2' => "Explora videos, tags y categorías de {$name}",
            'intro' => "Descubre el hub temático de {$name} con los mejores videos y tags relacionados.",
            'tag_slugs' => [$normalizedQuery],
            'category_slugs' => [],
            'language' => 'es',
        ]);

        SearchQueryAction::updateOrCreate(
            ['normalized_query' => $normalizedQuery],
            ['status' => 'converted']
        );

        return redirect()
            ->route('admin.seo-opportunities.index')
            ->with('status', 'Hub temático creado.');
    }
}
