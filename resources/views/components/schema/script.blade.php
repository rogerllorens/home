@props(['data'])
<script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">{!! json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
