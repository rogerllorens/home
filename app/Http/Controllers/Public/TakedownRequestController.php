<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\PublicTakedownRequest;
use App\Models\PublicTakedownRequest as PublicTakedown;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TakedownRequestController extends Controller
{
    public function show(): View
    {
        return view('public.legal.takedown');
    }

    public function store(PublicTakedownRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $hashSalt = (string) config('app.key', 'candidboys');
        $ipHash = $request->ip() ? hash_hmac('sha256', $request->ip(), $hashSalt) : null;
        $userAgent = $request->userAgent() ?: '';
        $userAgentHash = $userAgent !== '' ? hash_hmac('sha256', $userAgent, $hashSalt) : null;

        PublicTakedown::create([
            'url' => $data['url'],
            'email' => $data['email'],
            'requester_name' => $data['requester_name'] ?? null,
            'reason' => $data['reason'] ?? null,
            'notes' => $data['notes'] ?? null,
            'referrer' => $request->headers->get('referer'),
            'ip_hash' => $ipHash,
            'user_agent_hash' => $userAgentHash,
        ]);

        return back()->with('status', 'Solicitud recibida. Revisaremos el caso.');
    }
}
