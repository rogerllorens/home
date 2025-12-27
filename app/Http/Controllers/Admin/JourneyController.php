<?php

namespace App\Http\Controllers\Admin;

use App\Enums\JourneyStatus;
use App\Http\Controllers\Controller;
use App\Models\Journey;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class JourneyController extends Controller
{
    public function index(): View
    {
        $journeys = Journey::query()
            ->orderByDesc('updated_at')
            ->paginate(20);

        return view('admin.journeys.index', [
            'journeys' => $journeys,
        ]);
    }

    public function create(): View
    {
        return view('admin.journeys.form', [
            'journey' => new Journey(),
            'selectedVideos' => collect(),
            'searchResults' => collect(),
            'filters' => [],
            'statuses' => JourneyStatus::cases(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->normalizePayload($this->validatePayload($request));
        $journey = Journey::create($data);
        $this->syncVideos($journey, $request->input('videos', []), $request->input('positions', []));

        return redirect()->route('admin.journeys.index')->with('status', 'Journey creado.');
    }

    public function edit(Journey $journey): View
    {
        $filters = [
            'q' => request()->string('q')->trim()->toString(),
            'category_slug' => request()->string('category_slug')->trim()->toString(),
        ];

        $searchResults = $this->searchVideos($filters['q'], $filters['category_slug']);
        $selectedVideos = $journey->videos()
            ->withPivot('position')
            ->orderByRaw('case when journey_video.position is null then 1 else 0 end, journey_video.position asc, videos.published_at desc')
            ->get();

        return view('admin.journeys.form', [
            'journey' => $journey,
            'selectedVideos' => $selectedVideos,
            'searchResults' => $searchResults,
            'filters' => $filters,
            'statuses' => JourneyStatus::cases(),
        ]);
    }

    public function update(Request $request, Journey $journey): RedirectResponse
    {
        $data = $this->normalizePayload($this->validatePayload($request));
        $journey->update($data);
        $this->syncVideos($journey, $request->input('videos', []), $request->input('positions', []));

        return redirect()->route('admin.journeys.index')->with('status', 'Journey actualizado.');
    }

    public function destroy(Journey $journey): RedirectResponse
    {
        $journey->delete();

        return redirect()->route('admin.journeys.index')->with('status', 'Journey eliminado.');
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', 'max:40'],
        ]);
    }

    private function normalizePayload(array $data): array
    {
        $slug = $data['slug'] ?: Str::slug($data['title']);
        $data['slug'] = $slug;
        $data['status'] = $data['status'] ?? JourneyStatus::Draft->value;

        return $data;
    }

    private function syncVideos(Journey $journey, array $videoIds, array $positions): void
    {
        $ids = collect($videoIds)
            ->keys()
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            $journey->videos()->sync([]);
            return;
        }

        $validIds = Video::query()->whereIn('id', $ids)->pluck('id')->all();
        $syncPayload = collect($validIds)->mapWithKeys(function ($id) use ($positions) {
            $position = isset($positions[$id]) && $positions[$id] !== ''
                ? (int) $positions[$id]
                : null;
            return [$id => ['position' => $position]];
        })->all();

        $journey->videos()->sync($syncPayload);
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
