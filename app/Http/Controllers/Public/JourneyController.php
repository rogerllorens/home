<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Journey;
use Illuminate\View\View;

class JourneyController extends Controller
{
    public function show(string $slug): View
    {
        $journey = Journey::published()
            ->where('slug', $slug)
            ->firstOrFail();

        $videos = $journey->videos()
            ->withSum('viewsDaily', 'views')
            ->get();

        return view('public.journey', [
            'journey' => $journey,
            'videos' => $videos,
        ]);
    }
}
