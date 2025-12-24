<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\PublicContactRequest;
use App\Models\PublicContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ContactController extends Controller
{
    public function show(): View
    {
        return view('public.legal.contact');
    }

    public function store(PublicContactRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $hashSalt = (string) config('app.key', 'candidboys');
        $ipHash = $request->ip() ? hash_hmac('sha256', $request->ip(), $hashSalt) : null;
        $userAgent = $request->userAgent() ?: '';
        $userAgentHash = $userAgent !== '' ? hash_hmac('sha256', $userAgent, $hashSalt) : null;

        PublicContactMessage::create([
            'name' => $data['name'] ?? null,
            'email' => $data['email'],
            'subject' => $data['subject'] ?? null,
            'message' => $data['message'],
            'referrer' => $request->headers->get('referer'),
            'ip_hash' => $ipHash,
            'user_agent_hash' => $userAgentHash,
        ]);

        return back()->with('status', 'Mensaje enviado. Gracias por contactarnos.');
    }
}
