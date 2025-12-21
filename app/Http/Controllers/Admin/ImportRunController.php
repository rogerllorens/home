<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImportRun;
use Illuminate\View\View;

class ImportRunController extends Controller
{
    public function index(): View
    {
        return view('admin.import-runs.index', [
            'runs' => ImportRun::with('source')->latest()->paginate(20),
        ]);
    }

    public function show(ImportRun $importRun): View
    {
        return view('admin.import-runs.show', [
            'run' => $importRun->load('source'),
        ]);
    }
}
