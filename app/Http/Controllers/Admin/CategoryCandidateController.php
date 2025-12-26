<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryCandidate;
use App\Services\CategoryAutoCreator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CategoryCandidateController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->string('status')->trim()->toString();

        $candidates = CategoryCandidate::query()
            ->with('parent')
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderByDesc('hits_last_30d')
            ->paginate(20)
            ->withQueryString();

        return view('admin.category-candidates.index', [
            'candidates' => $candidates,
            'status' => $status,
        ]);
    }

    public function approve(CategoryCandidate $candidate, CategoryAutoCreator $creator): RedirectResponse
    {
        $category = $creator->createFromCandidate($candidate);

        if (!$category) {
            return redirect()->route('admin.category-candidates.index')
                ->with('status', 'No se pudo aprobar el candidato (conflicto o pocos vídeos).');
        }

        return redirect()->route('admin.category-candidates.index')
            ->with('status', 'Candidato aprobado y categoría creada.');
    }

    public function reject(CategoryCandidate $candidate): RedirectResponse
    {
        $candidate->update(['status' => 'rejected']);

        return redirect()->route('admin.category-candidates.index')
            ->with('status', 'Candidato rechazado.');
    }
}
