<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CtaClickController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImportRunController;
use App\Http\Controllers\Admin\SourceController;
use App\Http\Controllers\Admin\TakedownController;
use App\Http\Controllers\Admin\VideoController;
use App\Http\Controllers\Public\CtaTrackingController;
use App\Http\Controllers\Public\CategoryController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\SearchController;
use App\Http\Controllers\Public\SitemapController;
use App\Http\Controllers\Public\TagController;
use App\Http\Controllers\Public\VideoController as PublicVideoController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('public.home');
Route::get('/v/{slug}-{id}', PublicVideoController::class)->whereNumber('id')->name('public.video')->middleware('throttle:video');
Route::get('/c/{category_slug}', CategoryController::class)->name('public.category');
Route::get('/t/{tag_slug}', TagController::class)->name('public.tag');
Route::get('/search', SearchController::class)->name('public.search')->middleware('throttle:search');
Route::get('/r/{video}/{ctaKey}', CtaTrackingController::class)->name('public.cta.track');
Route::view('/terms', 'public.legal.terms')->name('public.terms');
Route::view('/privacy', 'public.legal.privacy')->name('public.privacy');
Route::view('/takedown', 'public.legal.takedown')->name('public.takedown');
Route::view('/contact', 'public.legal.contact')->name('public.contact');
Route::get('/sitemaps/index.xml', [SitemapController::class, 'index'])->name('public.sitemap.index');
Route::get('/sitemaps/videos-{file}', [SitemapController::class, 'videos'])->where('file', '.*\\.xml')->name('public.sitemap.videos');
Route::get('/sitemaps/categories-{file}', [SitemapController::class, 'categories'])->where('file', '.*\\.xml')->name('public.sitemap.categories');
Route::get('/sitemaps/tags-{file}', [SitemapController::class, 'tags'])->where('file', '.*\\.xml')->name('public.sitemap.tags');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:admin_login');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('admin.auth')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::get('sources', [SourceController::class, 'index'])->name('sources.index');
        Route::get('sources/create', [SourceController::class, 'create'])->name('sources.create');
        Route::post('sources', [SourceController::class, 'store'])->name('sources.store');
        Route::get('sources/{source}/edit', [SourceController::class, 'edit'])->name('sources.edit');
        Route::put('sources/{source}', [SourceController::class, 'update'])->name('sources.update');
        Route::delete('sources/{source}', [SourceController::class, 'destroy'])->name('sources.destroy');

        Route::get('import-runs', [ImportRunController::class, 'index'])->name('import-runs.index');
        Route::get('import-runs/{importRun}', [ImportRunController::class, 'show'])->name('import-runs.show');

        Route::get('videos', [VideoController::class, 'index'])->name('videos.index');
        Route::get('videos/{video}', [VideoController::class, 'show'])->name('videos.show');
        Route::post('videos/{video}/publish', [VideoController::class, 'publish'])->name('videos.publish');
        Route::post('videos/{video}/unpublish', [VideoController::class, 'unpublish'])->name('videos.unpublish');
        Route::post('videos/{video}/regenerate-ai', [VideoController::class, 'regenerateAi'])->name('videos.regenerate-ai');
        Route::post('videos/{video}/mark-broken', [VideoController::class, 'markBroken'])->name('videos.mark-broken');

        Route::get('takedowns', [TakedownController::class, 'index'])->name('takedowns.index');
        Route::get('takedowns/create', [TakedownController::class, 'create'])->name('takedowns.create');
        Route::post('takedowns', [TakedownController::class, 'store'])->name('takedowns.store');
        Route::get('takedowns/{takedown}/edit', [TakedownController::class, 'edit'])->name('takedowns.edit');
        Route::put('takedowns/{takedown}', [TakedownController::class, 'update'])->name('takedowns.update');
        Route::delete('takedowns/{takedown}', [TakedownController::class, 'destroy'])->name('takedowns.destroy');

        Route::get('cta-clicks', [CtaClickController::class, 'index'])->name('cta-clicks.index');
    });
});
