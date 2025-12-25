@props([
    'title',
    'description' => null,
    'canonical' => null,
    'robots' => null,
    'ogImage' => null,
])

@php
    $titleLimit = (int) config('candidboys.seo.title_max', 70);
    $descLimit = (int) config('candidboys.seo.desc_max', 160);
    $resolvedTitle = \Illuminate\Support\Str::limit($title, $titleLimit, '');
    $resolvedDescription = $description
        ? \Illuminate\Support\Str::limit($description, $descLimit, '')
        : null;
@endphp

<title>{{ $resolvedTitle }}</title>
@if ($description)
    <meta name="description" content="{{ $resolvedDescription }}">
@endif
@if ($canonical)
    <link rel="canonical" href="{{ $canonical }}">
@endif
@if ($robots)
    <meta name="robots" content="{{ $robots }}">
@endif
@if ($ogImage)
    <meta property="og:image" content="{{ $ogImage }}">
@endif
