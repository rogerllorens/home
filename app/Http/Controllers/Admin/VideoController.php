<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VideoStatus;
use App\Enums\VideoModerationStatus;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateVideoSeoJob;
use App\Models\AdminAuditLog;
use App\Models\Source;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function index(Request $request): View
    {
        $query = Video::with('source');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('moderation_status')) {
            $query->where('moderation_status', $request->string('moderation_status'));
        }

        if ($request->filled('source')) {
            $query->where('source_id', $request->string('source'));
        }

        if ($request->filled('category_slug')) {
            $query->where('category_slug', $request->string('category_slug'));
        }

        if ($request->filled('q')) {
            $query->where(function ($builder) use ($request) {
                $term = $request->string('q')->toString();
                $builder->where('title', 'ilike', "%{$term}%")
                    ->orWhere('seo_title', 'ilike', "%{$term}%");
            });
        }

        $sort = $request->string('sort', 'recent')->toString();
        $query = match ($sort) {
            'oldest' => $query->orderBy('created_at'),
            'status' => $query->orderBy('status')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'),
        };

        return view('admin.videos.index', [
            'videos' => $query->paginate(20)->withQueryString(),
            'sources' => Source::orderBy('name')->get(),
            'statuses' => VideoStatus::cases(),
            'moderationStatuses' => VideoModerationStatus::cases(),
            'filters' => $request->only(['status', 'moderation_status', 'source', 'category_slug', 'q', 'sort']),
        ]);
    }

    public function show(Video $video): View
    {
        return view('admin.videos.show', [
            'video' => $video->load('source', 'takedowns', 'journeys'),
        ]);
    }

    public function publish(Video $video): RedirectResponse
    {
        if ($video->status !== VideoStatus::Ready) {
            return back()->with('status', 'El video no está listo para publicar.');
        }

        if ($video->moderation_status !== VideoModerationStatus::Approved) {
            return back()->with('status', 'El video debe estar aprobado para publicarse.');
        }

        $video->update([
            'status' => VideoStatus::Published,
            'published_at' => now(),
        ]);

        AdminAuditLog::record('video_publish', [
            'video_id' => $video->id,
        ]);
        PublicCache::bust();

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

        AdminAuditLog::record('video_unpublish', [
            'video_id' => $video->id,
        ]);
        PublicCache::bust();

        return back()->with('status', 'Video despublicado (se mantiene published_at).');
    }

    public function regenerateAi(Video $video): RedirectResponse
    {
        $video->update([
            'status' => VideoStatus::Draft,
        ]);

        AdminAuditLog::record('video_regenerate_ai', [
            'video_id' => $video->id,
        ]);
        PublicCache::bust();
        GenerateVideoSeoJob::dispatch($video->id);

        return back()->with('status', 'SEO en cola para regeneración.');
    }

    public function markBroken(Video $video): RedirectResponse
    {
        $video->update([
            'status' => VideoStatus::Broken,
            'embed_ok' => false,
        ]);

        AdminAuditLog::record('video_mark_broken', [
            'video_id' => $video->id,
        ]);
        PublicCache::bust();

        return back()->with('status', 'Video marcado como roto.');
    }

    public function approve(Video $video): RedirectResponse
    {
        $video->update([
            'moderation_status' => VideoModerationStatus::Approved,
            'moderation_reviewed_at' => now(),
            'moderation_reviewed_by' => auth()->id(),
        ]);

        AdminAuditLog::record('video_moderation_approved', [
            'video_id' => $video->id,
        ]);

        return back()->with('status', 'Video aprobado.');
    }

    public function reject(Video $video): RedirectResponse
    {
        $video->update([
            'moderation_status' => VideoModerationStatus::Rejected,
            'moderation_reviewed_at' => now(),
            'moderation_reviewed_by' => auth()->id(),
            'status' => VideoStatus::Ready,
        ]);

        AdminAuditLog::record('video_moderation_rejected', [
            'video_id' => $video->id,
        ]);

        return back()->with('status', 'Video rechazado.');
    }

    public function feature(Video $video): RedirectResponse
    {
        $video->update([
            'is_featured' => true,
        ]);

        AdminAuditLog::record('video_featured', [
            'video_id' => $video->id,
        ]);

        return back()->with('status', 'Video marcado como destacado.');
    }

    public function unfeature(Video $video): RedirectResponse
    {
        $video->update([
            'is_featured' => false,
        ]);

        AdminAuditLog::record('video_unfeatured', [
            'video_id' => $video->id,
        ]);

        return back()->with('status', 'Video desmarcado como destacado.');
    }

    public function updateTransparency(Request $request, Video $video): RedirectResponse
    {
        $data = $request->validate([
            'is_manual_upload' => ['nullable', 'boolean'],
            'has_takedown_contact' => ['nullable', 'boolean'],
        ]);

        $video->update([
            'is_manual_upload' => (bool) ($data['is_manual_upload'] ?? false),
            'has_takedown_contact' => (bool) ($data['has_takedown_contact'] ?? false),
        ]);

        AdminAuditLog::record('video_transparency_updated', [
            'video_id' => $video->id,
            'is_manual_upload' => $video->is_manual_upload,
            'has_takedown_contact' => $video->has_takedown_contact,
        ]);

        PublicCache::bust();

        return back()->with('status', 'Transparencia actualizada.');
    }
}
