<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Analytics\TrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class TrackingController extends Controller
{
    public function store(Request $request, TrackingService $tracking): JsonResponse
    {
        $data = $request->validate([
            'event' => ['required', 'string', 'max:120'],
            'properties' => ['nullable', 'array'],
        ]);

        $properties = Arr::only($data['properties'] ?? [], [
            'video_id',
            'category',
            'tag',
            'cta_key',
            'cta_label',
            'query',
            'filter',
            'value',
            'percent',
            'context',
            'position',
        ]);

        $tracking->track($data['event'], $properties, $request);

        return response()->json(['status' => 'ok']);
    }
}
