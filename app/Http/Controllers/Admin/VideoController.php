<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateVideoSeoJob;
use App\Models\Source;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function index(Request $request): View
    {
        $query = Video::with('source')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('source')) {
            $query->where('source_id', $request->string('source'));
        }

        if ($request->filled('category_slug')) {
            $query->where('category_slug', $request->string('category_slug'));
        }

        return view('admin.videos.index', [
            'videos' => $query->paginate(20)->withQueryString(),
            'sources' => Source::orderBy('name')->get(),
            'statuses' => VideoStatus::cases(),
            'filters' => $request->only(['status', 'source', 'category_slug']),
        ]);
    }

    public function show(Video $video): View
    {
        return view('admin.videos.show', [
            'video' => $video->load('source', 'takedowns'),
        ]);
    }

    public function publish(Video $video): RedirectResponse
    {
        if ($video->status !== VideoStatus::Ready) {
            return back()->with('status', 'El video no está listo para publicar.');
        }

        $video->update([
            'status' => VideoStatus::Published,
            'published_at' => now(),
        ]);

        return back()->with('status', 'Video publicado.');
    }

    public function unpublish(Video $video): RedirectResponse
    {
        if ($video->status !== VideoStatus::Published) {
            return back()->with('status', 'El video no está publicado.');
        }

        $video->update([
            'status' => VideoStatus::Ready,
        ]);

        return back()->with('status', 'Video despublicado (se mantiene published_at).');
    }

    public function regenerateAi(Video $video): RedirectResponse
    {
        $video->update([
            'status' => VideoStatus::Draft,
        ]);

        GenerateVideoSeoJob::dispatch($video->id);

        return back()->with('status', 'SEO en cola para regeneración.');
    }

    public function markBroken(Video $video): RedirectResponse
    {
        $video->update([
            'status' => VideoStatus::Broken,
            'embed_ok' => false,
        ]);

        return back()->with('status', 'Video marcado como roto.');
    }
}
