<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class SearchController extends Controller
{
    public function __invoke(Request $request): View
    {
        $query = $request->string('q')->trim()->toString();

        $videos = $this->searchWithFallback($query);

        return view('public.search', [
            'videos' => $videos,
            'query' => $query,
        ]);
    }

    private function searchWithFallback(string $query)
    {
        if ($query !== '' && $this->meiliAvailable() && config('scout.driver') === 'meilisearch') {
            try {
                return Video::search($query)
                    ->where('status', VideoStatus::Published->value)
                    ->simplePaginate(18)
                    ->withQueryString();
            } catch (\Throwable $exception) {
                Log::debug('Search fallback to SQL', ['error' => $exception->getMessage()]);
            }
        }

        return Video::query()
            ->where('status', VideoStatus::Published->value)
            ->when($query !== '', function ($builder) use ($query) {
                $builder->where(function ($subQuery) use ($query) {
                    $subQuery->where('seo_title', 'ilike', "%{$query}%")
                        ->orWhere('title', 'ilike', "%{$query}%")
                        ->orWhere('seo_description', 'ilike', "%{$query}%")
                        ->orWhere('description', 'ilike', "%{$query}%");
                });
            })
            ->orderByDesc('published_at')
            ->paginate(18)
            ->withQueryString();
    }

    private function meiliAvailable(): bool
    {
        $host = rtrim(config('scout.meilisearch.host', ''), '/');
        if ($host === '') {
            return false;
        }

        try {
            $response = Http::timeout(2)->get("{$host}/health");
            return $response->successful();
        } catch (\Throwable $exception) {
            Log::debug('Meilisearch unavailable', ['error' => $exception->getMessage()]);
            return false;
        }
    }
}
