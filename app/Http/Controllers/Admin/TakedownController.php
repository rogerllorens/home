<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TakedownStatus;
use App\Http\Controllers\Controller;
use App\Models\Takedown;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TakedownController extends Controller
{
    public function index(): View
    {
        return view('admin.takedowns.index', [
            'takedowns' => Takedown::with('video')->latest()->paginate(20),
        ]);
    }

    public function create(): View
    {
        return view('admin.takedowns.form', [
            'takedown' => new Takedown(),
            'videos' => Video::orderBy('title')->get(),
            'statuses' => TakedownStatus::cases(),
            'method' => 'post',
            'route' => route('admin.takedowns.store'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateTakedown($request);
        Takedown::create($data);

        return redirect()->route('admin.takedowns.index')
            ->with('status', 'Takedown creado correctamente.');
    }

    public function edit(Takedown $takedown): View
    {
        return view('admin.takedowns.form', [
            'takedown' => $takedown,
            'videos' => Video::orderBy('title')->get(),
            'statuses' => TakedownStatus::cases(),
            'method' => 'put',
            'route' => route('admin.takedowns.update', $takedown),
        ]);
    }

    public function update(Request $request, Takedown $takedown): RedirectResponse
    {
        $data = $this->validateTakedown($request);
        $takedown->update($data);

        return redirect()->route('admin.takedowns.index')
            ->with('status', 'Takedown actualizado correctamente.');
    }

    public function destroy(Takedown $takedown): RedirectResponse
    {
        $takedown->delete();

        return redirect()->route('admin.takedowns.index')
            ->with('status', 'Takedown eliminado correctamente.');
    }

    private function validateTakedown(Request $request): array
    {
        return $request->validate([
            'video_id' => ['required', 'exists:videos,id'],
            'status' => ['required', 'string'],
            'reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'requested_at' => ['nullable', 'date'],
            'resolved_at' => ['nullable', 'date'],
        ]);
    }
}
