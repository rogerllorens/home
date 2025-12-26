<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoLike;
use App\Support\DeviceHash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoLikeController extends Controller
{
    public function __invoke(Request $request, Video $video): JsonResponse
    {
        $deviceHash = DeviceHash::ensure($request);

        $existing = VideoLike::query()
            ->where('video_id', $video->id)
            ->where('device_hash', $deviceHash)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            VideoLike::create([
                'video_id' => $video->id,
                'device_hash' => $deviceHash,
            ]);
            $liked = true;
        }

        $likesCount = VideoLike::query()
            ->where('video_id', $video->id)
            ->count();

        return response()->json([
            'likes_count' => $likesCount,
            'liked' => $liked,
        ]);
    }
}
