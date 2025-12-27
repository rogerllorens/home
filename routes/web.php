<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CategoryCandidateController;
use App\Http\Controllers\Admin\CategoryMetricsController;
use App\Http\Controllers\Admin\CtaClickController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\CollectionMetricsController;
use App\Http\Controllers\Admin\LandingCandidateController;
use App\Http\Controllers\Admin\LandingMetricsListController;
use App\Http\Controllers\Admin\LandingMetricsController;
use App\Http\Controllers\Admin\ImportRunController;
use App\Http\Controllers\Admin\SourceController;
use App\Http\Controllers\Admin\TakedownController;
use App\Http\Controllers\Admin\VideoController;
use App\Http\Controllers\ObservabilityController;
use App\Http\Controllers\Public\CtaTrackingController;
use App\Http\Controllers\Public\CategoryController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\ArticlesController;
use App\Http\Controllers\Public\CollectionController;
use App\Http\Controllers\Public\CtaLandingController;
use App\Http\Controllers\Public\DurationVideosController;
use App\Http\Controllers\Public\ContentMapController;
use App\Http\Controllers\Public\DiscoverController;
use App\Http\Controllers\Public\EntityController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\ReelsController;
use App\Http\Controllers\Public\SearchController;
use App\Http\Controllers\Public\SeoLandingController;
use App\Http\Controllers\Public\SitemapController;
use App\Http\Controllers\Public\TagController;
use App\Http\Controllers\Public\TopicClusterController;
use App\Http\Controllers\Public\TopVideosController;
use App\Http\Controllers\Public\TaxonomyController;
use App\Http\Controllers\Public\TakedownRequestController;
use App\Http\Controllers\Public\VideoEventController;
use App\Http\Controllers\Public\VideoLikeController;
use App\Http\Controllers\Public\VideoController as PublicVideoController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $preferred = request()->getPreferredLanguage(['en', 'es']) ?? 'en';
    return redirect()->to("/{$preferred}");
});

Route::prefix('{locale}')
    ->whereIn('locale', ['en', 'es'])
    ->middleware('locale')
    ->group(function () {
        Route::get('/', HomeController::class)->name('public.home');
        Route::get('/live', function () {
            return view('public.live');
        })->name('public.live');
        Route::get('/about', function () {
            return view('public.about');
        })->name('public.about');
        Route::get('/reels', ReelsController::class)->name('public.reels');
        Route::get('/reels/feed', [ReelsController::class, 'feed'])->name('public.reels.feed');
        Route::get('/top/this-week', [TopVideosController::class, 'global'])->defaults('period', 'this-week')->name('public.top.week');
        Route::get('/top/this-month', [TopVideosController::class, 'global'])->defaults('period', 'this-month')->name('public.top.month');
        Route::get('/top/{categorySlug}/this-week', [TopVideosController::class, 'category'])->defaults('period', 'this-week')->name('public.top.category.week');
        Route::get('/top/{categorySlug}/this-month', [TopVideosController::class, 'category'])->defaults('period', 'this-month')->name('public.top.category.month');
        Route::get('/top/{category}/{duration}/{timeframe}', [SeoLandingController::class, 'top'])->name('public.seo.top');
        Route::get('/short-videos', [DurationVideosController::class, 'global'])->defaults('range', 'short')->name('public.short');
        Route::get('/long-videos', [DurationVideosController::class, 'global'])->defaults('range', 'long')->name('public.long');
        Route::get('/categories/{categorySlug}/short', [DurationVideosController::class, 'category'])->defaults('range', 'short')->name('public.category.short');
        Route::get('/categories/{categorySlug}/long', [DurationVideosController::class, 'category'])->defaults('range', 'long')->name('public.category.long');
        Route::get('/collections', [CollectionController::class, 'index'])->name('public.collections.index');
        Route::get('/collections/{slug}', [CollectionController::class, 'show'])->name('public.collections.show');
        Route::get('/safety', function () {
            return view('public.safety');
        })->name('public.safety');
        Route::get('/articles', [ArticlesController::class, 'index'])->name('public.articles');
        Route::get('/articles/{slug}', [ArticlesController::class, 'show'])->name('public.articles.show');
        Route::get('/go/{ctaKey}', CtaLandingController::class)->name('public.cta.landing');
        Route::get('/categories', [TaxonomyController::class, 'categories'])->name('public.categories');
        Route::get('/tags', [TaxonomyController::class, 'tags'])->name('public.tags');
        Route::get('/discover/{slug}', DiscoverController::class)->name('public.discover');
        Route::get('/themes/{slug}', [TopicClusterController::class, 'show'])->name('public.theme');
        Route::get('/map', [ContentMapController::class, 'show'])->name('public.map');
        Route::get('/e/{slug}', [EntityController::class, 'show'])->name('public.entity');
        Route::get('/health', [ObservabilityController::class, 'health'])->name('public.health');
        Route::get('/metrics', [ObservabilityController::class, 'metrics'])->name('public.metrics');
        Route::get('/v/{slug}-{id}', PublicVideoController::class)
            ->whereNumber('id')
            ->where('slug', '[A-Za-z0-9-]+')
            ->name('public.video')
            ->middleware(['throttle:video', 'device.hash']);
        Route::get('/c/{category_slug}', CategoryController::class)->name('public.category');
        Route::get('/t/{tag_slug}', TagController::class)->name('public.tag');
        Route::get('/search', SearchController::class)->name('public.search')->middleware('throttle:search');
        Route::get('/r/{video}/{ctaKey}', CtaTrackingController::class)->name('public.cta.track');
        Route::get('/events/video', VideoEventController::class)->middleware('throttle:video_events')->name('public.video.events');
        Route::post('/videos/{video}/like', VideoLikeController::class)
            ->name('public.video.like')
            ->middleware('device.hash');
        Route::view('/terms', 'public.legal.terms')->name('public.terms');
        Route::view('/privacy', 'public.legal.privacy')->name('public.privacy');
        Route::get('/takedown', [TakedownRequestController::class, 'show'])->name('public.takedown');
        Route::post('/takedown', [TakedownRequestController::class, 'store'])->middleware('throttle:public_takedown');
        Route::get('/contact', [ContactController::class, 'show'])->name('public.contact');
        Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:public_contact');
    });

Route::get('/sitemaps/index.xml', [SitemapController::class, 'index'])->name('public.sitemap.index');
Route::get('/sitemaps/videos-{file}', [SitemapController::class, 'videos'])->where('file', '.*\\.xml')->name('public.sitemap.videos');
Route::get('/sitemaps/categories-{file}', [SitemapController::class, 'categories'])->where('file', '.*\\.xml')->name('public.sitemap.categories');
Route::get('/sitemaps/tags-{file}', [SitemapController::class, 'tags'])->where('file', '.*\\.xml')->name('public.sitemap.tags');
Route::get('/sitemaps/discover-{file}', [SitemapController::class, 'discover'])->where('file', '.*\\.xml')->name('public.sitemap.discover');
Route::get('/sitemaps/seo-landings-{file}', [SitemapController::class, 'seoLandings'])->where('file', '.*\\.xml')->name('public.sitemap.seo-landings');
Route::get('/sitemaps/themes-{file}', [SitemapController::class, 'themes'])->where('file', '.*\\.xml')->name('public.sitemap.themes');
Route::get('/api/content-map', [ContentMapController::class, 'data'])->name('public.content-map');

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
        Route::get('collections', [\App\Http\Controllers\Admin\CollectionController::class, 'index'])->name('collections.index');
        Route::get('collections/create', [\App\Http\Controllers\Admin\CollectionController::class, 'create'])->name('collections.create');
        Route::post('collections', [\App\Http\Controllers\Admin\CollectionController::class, 'store'])->name('collections.store');
        Route::get('collections/{collection}/edit', [\App\Http\Controllers\Admin\CollectionController::class, 'edit'])->name('collections.edit');
        Route::put('collections/{collection}', [\App\Http\Controllers\Admin\CollectionController::class, 'update'])->name('collections.update');
        Route::delete('collections/{collection}', [\App\Http\Controllers\Admin\CollectionController::class, 'destroy'])->name('collections.destroy');

        Route::get('landings/candidates', [LandingCandidateController::class, 'index'])->name('landing-candidates.index');
        Route::post('landings/candidates/{candidate}/approve', [LandingCandidateController::class, 'approve'])->name('landing-candidates.approve');
        Route::post('landings/candidates/{candidate}/ignore', [LandingCandidateController::class, 'ignore'])->name('landing-candidates.ignore');
        Route::get('landings/metrics', [LandingMetricsController::class, 'index'])->name('landing-metrics.index');

        Route::get('category-candidates', [CategoryCandidateController::class, 'index'])->name('category-candidates.index');
        Route::post('category-candidates/{candidate}/approve', [CategoryCandidateController::class, 'approve'])->name('category-candidates.approve');
        Route::post('category-candidates/{candidate}/reject', [CategoryCandidateController::class, 'reject'])->name('category-candidates.reject');
        Route::get('categories', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::get('metrics/categories', [CategoryMetricsController::class, 'index'])->name('metrics.categories');
        Route::get('metrics/collections', [CollectionMetricsController::class, 'index'])->name('metrics.collections');
        Route::get('metrics/landings', [LandingMetricsListController::class, 'index'])->name('metrics.landings');
        Route::get('seo-opportunities', [\App\Http\Controllers\Admin\SeoOpportunitiesController::class, 'index'])->name('seo-opportunities.index');
        Route::post('seo-opportunities/{normalizedQuery}/mark', [\App\Http\Controllers\Admin\SeoOpportunitiesController::class, 'mark'])->name('seo-opportunities.mark');
        Route::post('seo-opportunities/{normalizedQuery}/landing', [\App\Http\Controllers\Admin\SeoOpportunitiesController::class, 'createLanding'])->name('seo-opportunities.create-landing');
        Route::post('seo-opportunities/{normalizedQuery}/tag-landing', [\App\Http\Controllers\Admin\SeoOpportunitiesController::class, 'createTagLanding'])->name('seo-opportunities.create-tag');
        Route::post('seo-opportunities/{normalizedQuery}/cluster', [\App\Http\Controllers\Admin\SeoOpportunitiesController::class, 'createCluster'])->name('seo-opportunities.create-cluster');
        Route::get('seo-decay', [\App\Http\Controllers\Admin\SeoDecayController::class, 'index'])->name('seo-decay.index');
        Route::post('seo-decay/{metric}/refresh', [\App\Http\Controllers\Admin\SeoDecayController::class, 'refresh'])->name('seo-decay.refresh');
        Route::get('seo-meta-variants', [\App\Http\Controllers\Admin\SeoMetaVariantsController::class, 'index'])->name('seo-meta-variants.index');
        Route::post('seo-meta-variants/{variant}/winner', [\App\Http\Controllers\Admin\SeoMetaVariantsController::class, 'markWinner'])->name('seo-meta-variants.winner');
        Route::get('seo-health', [\App\Http\Controllers\Admin\SeoHealthController::class, 'index'])->name('seo-health.index');
        Route::post('seo-health/{issue}/resolve', [\App\Http\Controllers\Admin\SeoHealthController::class, 'markResolved'])->name('seo-health.resolve');
    });
});
