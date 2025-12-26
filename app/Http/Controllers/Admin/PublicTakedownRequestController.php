<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PublicTakedownStatus;
use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\PublicTakedownRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PublicTakedownRequestController extends Controller
{
    public function index(Request $request): View
    {
        $query = PublicTakedownRequest::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return view('admin.public-takedowns.index', [
            'requests' => $query->paginate(20)->withQueryString(),
            'statuses' => PublicTakedownStatus::cases(),
            'filters' => $request->only(['status']),
        ]);
    }

    public function update(Request $request, PublicTakedownRequest $publicTakedown): RedirectResponse
    {
        $status = $request->string('status')->toString();
        $statusEnum = PublicTakedownStatus::tryFrom($status);

        if (!$statusEnum) {
            return back()->with('status', 'Estado inválido.');
        }

        $updates = [
            'status' => $statusEnum,
            'handled_by' => auth()->id(),
        ];

        if ($statusEnum === PublicTakedownStatus::InReview && !$publicTakedown->reviewed_at) {
            $updates['reviewed_at'] = now();
        }

        if ($statusEnum === PublicTakedownStatus::Resolved) {
            $updates['resolved_at'] = now();
        }

        $publicTakedown->update($updates);

        AdminAuditLog::record('public_takedown_update', [
            'takedown_id' => $publicTakedown->id,
            'status' => $statusEnum->value,
        ]);

        return back()->with('status', 'Solicitud actualizada.');
    }
}
