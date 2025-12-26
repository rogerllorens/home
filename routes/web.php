<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CtaClickController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImportRunController;
use App\Http\Controllers\Admin\SourceController;
use App\Http\Controllers\Admin\TakedownController;
use App\Http\Controllers\Admin\VideoController;
use App\Http\Controllers\ObservabilityController;
use App\Http\Controllers\Public\CtaTrackingController;
use App\Http\Controllers\Public\CategoryController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\ArticlesController;
use App\Http\Controllers\Public\CtaLandingController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\SearchController;
use App\Http\Controllers\Public\SitemapController;
use App\Http\Controllers\Public\TagController;
use App\Http\Controllers\Public\TaxonomyController;
use App\Http\Controllers\Public\TakedownRequestController;
use App\Http\Controllers\Public\VideoEventController;
use App\Http\Controllers\Public\VideoController as PublicVideoController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('public.home');
Route::get('/live', function () {
    return view('public.live');
})->name('public.live');
Route::get('/about', function () {
    return view('public.about');
})->name('public.about');
Route::get('/safety', function () {
    return view('public.safety');
})->name('public.safety');
Route::get('/articles', [ArticlesController::class, 'index'])->name('public.articles');
Route::get('/articles/{slug}', [ArticlesController::class, 'show'])->name('public.articles.show');
Route::get('/go/{ctaKey}', CtaLandingController::class)->name('public.cta.landing');
Route::get('/categories', [TaxonomyController::class, 'categories'])->name('public.categories');
Route::get('/tags', [TaxonomyController::class, 'tags'])->name('public.tags');
Route::get('/health', [ObservabilityController::class, 'health'])->name('public.health');
Route::get('/metrics', [ObservabilityController::class, 'metrics'])->name('public.metrics');
Route::get('/v/{slug}-{id}', PublicVideoController::class)
    ->whereNumber('id')
    ->where('slug', '[A-Za-z0-9-]+')
    ->name('public.video')
    ->middleware('throttle:video');
Route::get('/c/{category_slug}', CategoryController::class)->name('public.category');
Route::get('/t/{tag_slug}', TagController::class)->name('public.tag');
Route::get('/search', SearchController::class)->name('public.search')->middleware('throttle:search');
Route::get('/r/{video}/{ctaKey}', CtaTrackingController::class)->name('public.cta.track');
Route::get('/events/video', VideoEventController::class)->middleware('throttle:video_events')->name('public.video.events');
Route::view('/terms', 'public.legal.terms')->name('public.terms');
Route::view('/privacy', 'public.legal.privacy')->name('public.privacy');
Route::get('/takedown', [TakedownRequestController::class, 'show'])->name('public.takedown');
Route::post('/takedown', [TakedownRequestController::class, 'store'])->middleware('throttle:public_takedown');
Route::get('/contact', [ContactController::class, 'show'])->name('public.contact');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:public_contact');
Route::get('/sitemaps/index.xml', [SitemapController::class, 'index'])->name('public.sitemap.index');
Route::get('/sitemaps/videos-{file}', [SitemapController::class, 'videos'])->where('file', '.*\\.xml')->name('public.sitemap.videos');
Route::get('/sitemaps/categories-{file}', [SitemapController::class, 'categories'])->where('file', '.*\\.xml')->name('public.sitemap.categories');
Route::get('/sitemaps/tags-{file}', [SitemapController::class, 'tags'])->where('file', '.*\\.xml')->name('public.sitemap.tags');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:admin_login');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware(['admin.auth', 'throttle:admin'])->group(function () {
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
