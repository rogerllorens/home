<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoLike;
use App\Services\Videos\RelatedVideosService;
use App\Support\DeviceHash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class ReelsController extends Controller
{
    public function __invoke(Request $request, RelatedVideosService $scorer): View
    {
        $page = (int) $request->query('page', 1);
        $perPage = 20;

        $videos = $this->viralVideos($scorer);
        $paginator = $this->paginate($videos, $perPage, $page);
        $this->hydrateLikes($paginator->items(), $request);

        return view('public.reels', [
            'videos' => collect($paginator->items()),
            'nextPage' => $paginator->currentPage() < $paginator->lastPage()
                ? $paginator->currentPage() + 1
                : null,
        ]);
    }

    public function feed(Request $request, RelatedVideosService $scorer): JsonResponse
    {
        $page = (int) $request->query('page', 1);
        $perPage = 20;

        $videos = $this->viralVideos($scorer);
        $paginator = $this->paginate($videos, $perPage, $page);
        $items = collect($paginator->items());
        $this->hydrateLikes($items, $request);

        $payload = $items->map(function (Video $video) {
            return [
                'id' => $video->id,
                'title' => $video->seo_title ?: $video->title,
                'slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title),
                'thumbnail' => $video->thumbnail_url,
                'embed_url' => $video->embed_url,
                'tags' => array_slice($video->raw_tags ?? [], 0, 6),
                'likes' => $video->display_likes ?? 0,
                'liked' => (bool) ($video->liked_by_device ?? false),
                'category' => $video->category_slug,
            ];
        });

        return response()->json([
            'data' => $payload,
            'next_page' => $paginator->currentPage() < $paginator->lastPage()
                ? $paginator->currentPage() + 1
                : null,
        ]);
    }

    private function viralVideos(RelatedVideosService $scorer): Collection
    {
        return Video::published()
            ->withCount('likes')
            ->withSum('viewsDaily', 'views')
            ->with('source')
            ->get()
            ->sortByDesc(fn (Video $video) => $scorer->score($video))
            ->values();
    }

    private function paginate(Collection $videos, int $perPage, int $page): LengthAwarePaginator
    {
        $page = max(1, $page);
        $total = $videos->count();
        $items = $videos->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator($items, $total, $perPage, $page, [
            'path' => url('/reels'),
            'query' => [],
        ]);
    }

    private function hydrateLikes(Collection $videos, Request $request): void
    {
        $deviceHash = DeviceHash::fromRequest($request);
        if (!$deviceHash) {
            $videos->each(fn (Video $video) => $video->setAttribute('liked_by_device', false));
            return;
        }

        $likedIds = VideoLike::query()
            ->where('device_hash', $deviceHash)
            ->whereIn('video_id', $videos->pluck('id'))
            ->pluck('video_id')
            ->all();

        $videos->each(function (Video $video) use ($likedIds) {
            $video->setAttribute('liked_by_device', in_array($video->id, $likedIds, true));
        });
    }
}
