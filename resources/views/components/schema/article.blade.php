@props(['article', 'url'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->article($article, $url))
<x-schema.script :data="$schema" />
