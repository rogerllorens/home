@props([
    'title',
    'description' => null,
    'canonical' => null,
    'robots' => null,
    'ogImage' => null,
])

<title>{{ $title }}</title>
@if ($description)
    <meta name="description" content="{{ $description }}">
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
