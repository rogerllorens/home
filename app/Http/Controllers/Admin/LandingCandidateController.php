<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingCandidate;
use App\Models\SearchLanding;
use App\Services\Search\SearchLandingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class LandingCandidateController extends Controller
{
    public function index(): View
    {
        $candidates = LandingCandidate::query()
            ->orderByDesc('hits_last_30d')
            ->paginate(20);

        return view('admin.landing-candidates.index', [
            'candidates' => $candidates,
        ]);
    }

    public function approve(LandingCandidate $candidate, SearchLandingService $landingService): RedirectResponse
    {
        $candidate->update(['status' => 'approved']);

        $videosCount = $landingService->countForQuery($candidate->query);
        $language = $this->detectLanguage($candidate->query);
        $description = $language === 'es'
            ? "Selección curada de vídeos relacionados con {$candidate->query}. Actualizada automáticamente."
            : "Curated selection of videos related to {$candidate->query}. Updated automatically.";

        SearchLanding::updateOrCreate(
            ['slug' => $candidate->slug],
            [
                'query' => $candidate->query,
                'title' => Str::title($candidate->query),
                'description' => $description,
                'language' => $language,
                'is_public' => true,
                'videos_count' => $videosCount,
            ]
        );

        return redirect()->route('admin.landing-candidates.index')
            ->with('status', 'Candidato aprobado.');
    }

    public function ignore(LandingCandidate $candidate): RedirectResponse
    {
        $candidate->update(['status' => 'ignored']);

        return redirect()->route('admin.landing-candidates.index')
            ->with('status', 'Candidato ignorado.');
    }

    private function detectLanguage(string $query): string
    {
        $lower = Str::lower($query);
        if (preg_match('/[áéíóúñü]/u', $lower)) {
            return 'es';
        }

        $spanishHints = [
            'hombres', 'chicos', 'pareja', 'parejas', 'primer', 'vez', 'afuera', 'playa',
            'casa', 'escuela', 'universidad', 'amigos', 'romántico', 'masaje',
        ];

        foreach ($spanishHints as $hint) {
            if (str_contains($lower, $hint)) {
                return 'es';
            }
        }

        return 'en';
    }
}
