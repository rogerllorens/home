<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VideoEventController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $videoId = (int) $request->query('video_id');
        $event = (string) $request->query('event');
        $value = $request->query('value');

        if (!$videoId || !in_array($event, ['play', 'scroll_50'], true)) {
            return response('', 400);
        }

        $video = Video::find($videoId);
        if (!$video) {
            return response('', 404);
        }

        $hashSalt = (string) config('app.key', 'candidboys');
        $ipHash = $request->ip() ? hash_hmac('sha256', $request->ip(), $hashSalt) : null;
        $userAgent = $request->userAgent() ?: '';
        $userAgentHash = $userAgent !== '' ? hash_hmac('sha256', $userAgent, $hashSalt) : null;

        VideoEvent::create([
            'video_id' => $video->id,
            'event' => $event,
            'value' => is_scalar($value) ? (string) $value : null,
            'referrer' => $request->headers->get('referer'),
            'ip_hash' => $ipHash,
            'user_agent_hash' => $userAgentHash,
        ]);

        return response('', 204);
    }
}
