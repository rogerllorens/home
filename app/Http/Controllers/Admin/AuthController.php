<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminLoginRequest;
use App\Models\AdminAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLogin(): View
    {
        return view('admin.login');
    }

    public function login(AdminLoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();

        if ($this->isLockedOut($request)) {
            return back()
                ->withErrors(['email' => 'Demasiados intentos. Intenta de nuevo más tarde.'])
                ->withInput()
                ->setStatusCode(429);
        }

        if (!Auth::attempt($credentials, true)) {
            $this->recordFailedAttempt($request);
            AdminAuditLog::record('admin_login_failed', [
                'email' => $credentials['email'],
            ]);
            return back()
                ->withErrors(['email' => 'Credenciales inválidas.'])
                ->withInput();
        }

        $request->session()->regenerate();
        $this->clearLockout($request);

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

    private function isLockedOut(Request $request): bool
    {
        $maxAttempts = (int) config('candidboys.security.admin_login_lockout_max_attempts', 0);
        if ($maxAttempts <= 0) {
            return false;
        }

        $lockoutUntil = Cache::get($this->lockoutKey($request));
        if (!$lockoutUntil) {
            return false;
        }

        return now()->lessThan($lockoutUntil);
    }

    private function recordFailedAttempt(Request $request): void
    {
        $maxAttempts = (int) config('candidboys.security.admin_login_lockout_max_attempts', 0);
        $lockoutMinutes = (int) config('candidboys.security.admin_login_lockout_minutes', 10);
        if ($maxAttempts <= 0) {
            return;
        }

        $attemptsKey = $this->attemptsKey($request);
        $attempts = (int) Cache::get($attemptsKey, 0) + 1;

        Cache::put($attemptsKey, $attempts, now()->addMinutes($lockoutMinutes));

        if ($attempts >= $maxAttempts) {
            Cache::put(
                $this->lockoutKey($request),
                now()->addMinutes($lockoutMinutes),
                now()->addMinutes($lockoutMinutes)
            );
        }
    }

    private function clearLockout(Request $request): void
    {
        Cache::forget($this->attemptsKey($request));
        Cache::forget($this->lockoutKey($request));
    }

    private function attemptsKey(Request $request): string
    {
        return 'admin_login_attempts:' . $this->lockoutIdentifier($request);
    }

    private function lockoutKey(Request $request): string
    {
        return 'admin_login_lockout:' . $this->lockoutIdentifier($request);
    }

    private function lockoutIdentifier(Request $request): string
    {
        $email = strtolower((string) $request->input('email', ''));
        $ip = (string) $request->ip();

        return sha1($email . '|' . $ip);
    }
}
