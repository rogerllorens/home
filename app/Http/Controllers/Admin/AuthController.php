<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLogin(): View
    {
        return view('admin.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials, true)) {
            AdminAuditLog::record('admin_login_failed', [
                'email' => $credentials['email'],
            ]);
            return back()
                ->withErrors(['email' => 'Credenciales inválidas.'])
                ->withInput();
        }

        $request->session()->regenerate();

        if (!Auth::user()?->is_admin) {
            AdminAuditLog::record('admin_login_forbidden', [
                'user_id' => Auth::id(),
            ]);
            Auth::logout();
            return back()
                ->withErrors(['email' => 'No autorizado.'])
                ->withInput();
        }

        AdminAuditLog::record('admin_login', [
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('admin.dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        AdminAuditLog::record('admin_logout', [
            'user_id' => Auth::id(),
        ]);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
