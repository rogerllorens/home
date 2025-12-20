<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SourceType;
use App\Http\Controllers\Controller;
use App\Models\Source;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SourceController extends Controller
{
    public function index(): View
    {
        return view('admin.sources.index', [
            'sources' => Source::orderBy('name')->paginate(15),
        ]);
    }

    public function create(): View
    {
        return view('admin.sources.form', [
            'source' => new Source(),
            'types' => SourceType::cases(),
            'method' => 'post',
            'route' => route('admin.sources.store'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateSource($request);
        $data['settings'] = $this->decodeSettings($data['settings']);

        Source::create($data);

        return redirect()->route('admin.sources.index')
            ->with('status', 'Fuente creada correctamente.');
    }

    public function edit(Source $source): View
    {
        return view('admin.sources.form', [
            'source' => $source,
            'types' => SourceType::cases(),
            'method' => 'put',
            'route' => route('admin.sources.update', $source),
        ]);
    }

    public function update(Request $request, Source $source): RedirectResponse
    {
        $data = $this->validateSource($request);
        $data['settings'] = $this->decodeSettings($data['settings']);

        $source->update($data);

        return redirect()->route('admin.sources.index')
            ->with('status', 'Fuente actualizada correctamente.');
    }

    public function destroy(Source $source): RedirectResponse
    {
        $source->delete();

        return redirect()->route('admin.sources.index')
            ->with('status', 'Fuente eliminada correctamente.');
    }

    private function validateSource(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'feed_url' => ['nullable', 'url'],
            'auth_header' => ['nullable', 'string', 'max:255'],
            'import_schedule_cron' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'settings' => ['nullable', 'string'],
        ]);
    }

    private function decodeSettings(?string $settings): array
    {
        if ($settings === null || trim($settings) === '') {
            return [];
        }

        $decoded = json_decode($settings, true);
        if (!is_array($decoded)) {
            abort(422, 'El JSON de settings no es válido.');
        }

        return $decoded;
    }
}
