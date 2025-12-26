<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleFromRoute
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = (string) $request->route('locale');
        if ($locale !== '') {
            app()->setLocale($locale);
            URL::defaults(['locale' => $locale]);
        }

        return $next($request);
    }
}
