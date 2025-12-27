<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Support\DeviceHash;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HistoryController extends Controller
{
    public function index(Request $request): View
    {
        $deviceHash = DeviceHash::fromRequest($request);
        $videos = collect();

        if ($deviceHash) {
            $historyIds = VideoViewHistory::query()
                ->where('device_hash', $deviceHash)
                ->orderByDesc('last_watched_at')
                ->limit((int) config('videos.continue_watching_limit', 10))
                ->pluck('video_id')
                ->all();

            if (!empty($historyIds)) {
                $videos = Video::published()
                    ->whereIn('id', $historyIds)
                    ->withSum('viewsDaily', 'views')
                    ->get()
                    ->sortBy(fn ($video) => array_search($video->id, $historyIds, true))
                    ->values();
            }
        }

        return view('public.history', [
            'videos' => $videos,
        ]);
    }
}
