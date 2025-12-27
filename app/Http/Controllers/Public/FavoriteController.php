<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Video;
use App\Support\DeviceHash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class FavoriteController extends Controller
{
    public function index(Request $request): View
    {
        $deviceHash = DeviceHash::fromRequest($request);
        $favorites = collect();

        if ($deviceHash) {
            $favoriteIds = Favorite::query()
                ->where('device_hash', $deviceHash)
                ->latest()
                ->pluck('video_id')
                ->all();

            if (!empty($favoriteIds)) {
                $favorites = Video::published()
                    ->whereIn('id', $favoriteIds)
                    ->withSum('viewsDaily', 'views')
                    ->get()
                    ->sortBy(fn ($video) => array_search($video->id, $favoriteIds, true))
                    ->values();
            }
        }

        return view('public.favorites', [
            'favorites' => $favorites,
        ]);
    }

    public function store(Request $request, Video $video): JsonResponse
    {
        $deviceHash = DeviceHash::ensure($request);

        Favorite::firstOrCreate([
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
        ]);

        return response()->json([
            'favorited' => true,
        ]);
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        $deviceHash = DeviceHash::ensure($request);

        Favorite::query()
            ->where('device_hash', $deviceHash)
            ->where('video_id', $video->id)
            ->delete();

        return response()->json([
            'favorited' => false,
        ]);
    }

    public function list(Request $request): JsonResponse
    {
        $deviceHash = DeviceHash::fromRequest($request);
        if (!$deviceHash) {
            return response()->json(['data' => []]);
        }

        $favorites = Favorite::query()
            ->where('device_hash', $deviceHash)
            ->latest()
            ->pluck('video_id')
            ->all();

        return response()->json([
            'data' => $favorites,
        ]);
    }
}
