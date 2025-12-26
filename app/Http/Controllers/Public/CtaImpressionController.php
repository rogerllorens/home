<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Cta;
use App\Models\CtaImpression;
use App\Models\Video;
use App\Support\DeviceHash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CtaImpressionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $publicId = $request->string('cta_id')->toString();
        $originPage = $request->string('origin')->toString() ?: null;
        $pageUrl = $request->string('page_url')->toString() ?: null;
        $referrer = $request->headers->get('referer');
        $videoId = $request->integer('video');

        $cta = $publicId ? Cta::where('public_id', $publicId)->first() : null;
        if (!$cta) {
            return response()->json(['ok' => false], 404);
        }

        $deviceHash = DeviceHash::fromRequest($request);
        $video = $videoId ? Video::find($videoId) : null;

        try {
            CtaImpression::create([
                'cta_id' => $cta->id,
                'video_id' => $video?->id,
                'origin_page' => $originPage,
                'page_url' => $pageUrl,
                'referrer' => $referrer,
                'device_hash' => $deviceHash,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('CTA impression tracking failed', [
                'cta_id' => $cta->id,
                'error' => $exception->getMessage(),
            ]);
            return response()->json(['ok' => false], 500);
        }

        return response()->json(['ok' => true]);
    }
}
