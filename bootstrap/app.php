<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withProviders([
        \App\Providers\FeatureFlagServiceProvider::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin.auth' => \App\Http\Middleware\AdminAuth::class,
            'csp.headers' => \App\Http\Middleware\CspHeaders::class,
            'locale' => \App\Http\Middleware\SetLocaleFromRoute::class,
            'device.hash' => \App\Http\Middleware\EnsureDeviceHash::class,
        ]);
        $middleware->prepend(\App\Http\Middleware\TrustProxies::class);
        $middleware->appendToGroup('web', \App\Http\Middleware\CspHeaders::class);
        $middleware->appendToGroup('web', \App\Http\Middleware\RequestMetrics::class);
        $middleware->appendToGroup('web', \App\Http\Middleware\EnsureDeviceHash::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (Throwable $exception): void {
            if ($exception instanceof HttpExceptionInterface && $exception->getStatusCode() < 500) {
                return;
            }

            $context = [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];

            if (!app()->runningInConsole()) {
                $request = request();
                $context = array_merge($context, [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'route' => optional($request->route())->getName(),
                    'user_id' => optional($request->user())->id,
                ]);
            }

            Log::error('Unhandled exception', $context);
        });

        $exceptions->render(function (Throwable $exception, Request $request) {
            if ($request->expectsJson()) {
                return null;
            }

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
                if ($status === 404) {
                    return response()->view('errors.404', [], 404);
                }

                if ($status === 429) {
                    return response()->view('errors.429', [], 429);
                }
            }

            if (app()->environment('local')) {
                return null;
            }

            return response()->view('errors.500', [], 500);
        });
    })->create();
