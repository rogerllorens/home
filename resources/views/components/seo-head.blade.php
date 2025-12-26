@props([
    'title',
    'description' => null,
    'canonical' => null,
    'robots' => null,
    'ogImage' => null,
    'ogType' => null,
    'twitterCard' => null,
])

@php
    $titleLimit = (int) config('candidboys.seo.title_max', 70);
    $descLimit = (int) config('candidboys.seo.desc_max', 160);
    $defaultOgImage = config('candidboys.seo.og_image', asset('favicon.ico'));
    $defaultOgType = config('candidboys.seo.og_type', 'website');
    $defaultTwitterCard = config('candidboys.seo.twitter_card', 'summary_large_image');
    $resolvedTitle = \Illuminate\Support\Str::limit($title, $titleLimit, '');
    $resolvedDescription = $description
        ? \Illuminate\Support\Str::limit($description, $descLimit, '')
        : null;
    $resolvedOgImage = $ogImage ?: $defaultOgImage;
    $resolvedOgType = $ogType ?: $defaultOgType;
    $resolvedTwitterCard = $twitterCard ?: $defaultTwitterCard;
    $resolvedRobots = $robots ?? config('candidboys.seo.robots', 'index,follow');
@endphp

<title>{{ $resolvedTitle }}</title>
@if ($description)
    <meta name="description" content="{{ $resolvedDescription }}">
@endif
@if ($canonical)
    <link rel="canonical" href="{{ $canonical }}">
@endif
@php
    $currentLocale = request()->route('locale');
    $alternateLocales = config('candidboys.locales', ['en', 'es']);
    $route = request()->route();
    $routeName = $route?->getName();
    $routeParams = $route?->parameters() ?? [];
    $queryString = request()->getQueryString();
    $defaultLocale = config('candidboys.default_language', config('app.locale'));
@endphp
@if ($currentLocale && in_array($currentLocale, $alternateLocales, true))
    @foreach ($alternateLocales as $locale)
        @php
            $params = array_merge($routeParams, ['locale' => $locale]);
            $alternateHref = $routeName
                ? route($routeName, $params)
                : url(preg_replace('#^/([a-z-]{2,5})/#', "/{$locale}/", request()->getRequestUri()));
            if ($queryString) {
                $alternateHref .= '?' . $queryString;
            }
        @endphp
        <link rel="alternate" hreflang="{{ $locale }}" href="{{ $alternateHref }}">
    @endforeach
    @if ($defaultLocale)
        @php
            $defaultParams = array_merge($routeParams, ['locale' => $defaultLocale]);
            $defaultHref = $routeName
                ? route($routeName, $defaultParams)
                : url(preg_replace('#^/([a-z-]{2,5})/#', "/{$defaultLocale}/", request()->getRequestUri()));
            if ($queryString) {
                $defaultHref .= '?' . $queryString;
            }
        @endphp
        <link rel="alternate" hreflang="x-default" href="{{ $defaultHref }}">
    @endif
@endif
<meta name="robots" content="{{ $resolvedRobots }}">
<meta property="og:title" content="{{ $resolvedTitle }}">
@if ($resolvedDescription)
    <meta property="og:description" content="{{ $resolvedDescription }}">
@endif
<meta property="og:type" content="{{ $resolvedOgType }}">
@if ($canonical)
    <meta property="og:url" content="{{ $canonical }}">
@endif
@if ($resolvedOgImage)
    <meta property="og:image" content="{{ $resolvedOgImage }}">
@endif
<meta name="twitter:card" content="{{ $resolvedTwitterCard }}">
<meta name="twitter:title" content="{{ $resolvedTitle }}">
@if ($resolvedDescription)
    <meta name="twitter:description" content="{{ $resolvedDescription }}">
@endif
@if ($resolvedOgImage)
    <meta name="twitter:image" content="{{ $resolvedOgImage }}">
@endif
