<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class CollectionController extends Controller
{
    public function index(): View
    {
        $collections = Collection::query()
            ->orderByDesc('created_at')
            ->paginate(20);

        return view('admin.collections.index', [
            'collections' => $collections,
        ]);
    }

    public function create(): View
    {
        return view('admin.collections.form', [
            'collection' => new Collection(),
            'selectedVideos' => collect(),
            'searchResults' => collect(),
            'filters' => [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->normalizePayload($this->validatePayload($request));
        $collection = Collection::create($data);
        $this->syncVideos($collection, $request->input('videos', []), $request->input('positions', []));

        return redirect()->route('admin.collections.index')->with('status', 'Colección creada.');
    }

    public function edit(Collection $collection): View
    {
        $filters = [
            'q' => request()->string('q')->trim()->toString(),
            'category_slug' => request()->string('category_slug')->trim()->toString(),
        ];

        $searchResults = $this->searchVideos($filters['q'], $filters['category_slug']);
        $selectedVideos = $collection->videos()
            ->withPivot('position')
            ->orderByRaw('case when collection_video.position is null then 1 else 0 end, collection_video.position asc, videos.published_at desc')
            ->get();

        return view('admin.collections.form', [
            'collection' => $collection,
            'selectedVideos' => $selectedVideos,
            'searchResults' => $searchResults,
            'filters' => $filters,
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $data = $this->normalizePayload($this->validatePayload($request));
        $collection->update($data);
        $this->syncVideos($collection, $request->input('videos', []), $request->input('positions', []));

        return redirect()->route('admin.collections.index')->with('status', 'Colección actualizada.');
    }

    public function destroy(Collection $collection): RedirectResponse
    {
        $collection->delete();

        return redirect()->route('admin.collections.index')->with('status', 'Colección eliminada.');
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_public' => ['nullable', 'boolean'],
            'is_auto_managed' => ['nullable', 'boolean'],
            'language' => ['nullable', 'string', 'max:8'],
        ]);
    }

    private function normalizePayload(array $data): array
    {
        $slug = $data['slug'] ?: Str::slug($data['name']);
        $data['slug'] = $slug;
        $data['is_public'] = (bool) ($data['is_public'] ?? false);
        $data['is_auto_managed'] = (bool) ($data['is_auto_managed'] ?? false);
        $data['language'] = $data['language'] ?? 'en';

        return $data;
    }

    private function syncVideos(Collection $collection, array $videoIds, array $positions): void
    {
        $ids = collect($videoIds)
            ->keys()
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            $collection->videos()->sync([]);
            return;
        }

        $validIds = Video::query()->whereIn('id', $ids)->pluck('id')->all();
        $syncPayload = collect($validIds)->mapWithKeys(function ($id) use ($positions) {
            $position = isset($positions[$id]) && $positions[$id] !== ''
                ? (int) $positions[$id]
                : null;
            return [$id => ['position' => $position]];
        })->all();

        $collection->videos()->sync($syncPayload);
    }

    private function searchVideos(string $query, string $categorySlug)
    {
        return Video::query()
            ->when($query !== '', function ($builder) use ($query) {
                $builder->where(function ($subQuery) use ($query) {
                    $subQuery->where('title', 'like', "%{$query}%")
                        ->orWhere('seo_title', 'like', "%{$query}%")
                        ->orWhere('id', (int) $query);
                });
            })
            ->when($categorySlug !== '', fn ($builder) => $builder->where('category_slug', $categorySlug))
            ->orderByDesc('published_at')
            ->limit(20)
            ->get();
    }
}
