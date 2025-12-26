<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Videos\VideoScoreService;
use Illuminate\Support\Str;
use Illuminate\View\View;

class TopVideosController extends Controller
{
    public function global(string $period, VideoScoreService $scorer): View
    {
        $periodDays = $this->periodDays($period);
        $videos = $scorer->getTrending($periodDays, 48);

        return view('public.top', [
            'heading' => "Top videos {$this->periodLabel($period)}",
            'description' => 'Selección de vídeos populares en base a actividad reciente y engagement.',
            'videos' => $videos,
        ]);
    }

    public function category(string $categorySlug, string $period, VideoScoreService $scorer): View
    {
        if (!in_array($categorySlug, config('candidboys.categories_controlled', []), true)) {
            abort(404);
        }

        $periodDays = $this->periodDays($period);
        $videos = $scorer->getTopByCategory($categorySlug, $periodDays, 48);
        $categoryLabel = Str::headline($categorySlug);

        return view('public.top', [
            'heading' => "Top {$categoryLabel} videos {$this->periodLabel($period)}",
            'description' => 'Explora el contenido con mejor rendimiento reciente en esta categoría.',
            'videos' => $videos,
        ]);
    }

    private function periodDays(string $period): int
    {
        return $period === 'this-month' ? 30 : 7;
    }

    private function periodLabel(string $period): string
    {
        return $period === 'this-month' ? 'this month' : 'this week';
    }
}
