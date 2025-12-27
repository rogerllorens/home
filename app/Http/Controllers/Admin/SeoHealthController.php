<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoHealthIssue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SeoHealthController extends Controller
{
    public function index(Request $request): View
    {
        $type = $request->string('type')->toString();
        $severity = $request->string('severity')->toString();
        $status = $request->string('status')->toString();

        $issues = SeoHealthIssue::query()
            ->when($type !== '', fn ($query) => $query->where('issue_type', $type))
            ->when($severity !== '', fn ($query) => $query->where('severity', $severity))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->get();

        return view('admin.seo-health.index', [
            'issues' => $issues,
            'type' => $type,
            'severity' => $severity,
            'status' => $status,
        ]);
    }

    public function markResolved(SeoHealthIssue $issue): RedirectResponse
    {
        $issue->update(['status' => 'resolved']);

        return back()->with('status', 'Issue marcado como resuelto.');
    }
}
