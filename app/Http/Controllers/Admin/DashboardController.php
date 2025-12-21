<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImportRun;
use App\Models\Source;
use App\Models\Takedown;
use App\Models\Video;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(): View
    {
        return view('admin.dashboard', [
            'sourcesCount' => Source::count(),
            'videosCount' => Video::count(),
            'takedownsCount' => Takedown::count(),
            'recentRuns' => ImportRun::latest()->take(5)->get(),
        ]);
    }
}
