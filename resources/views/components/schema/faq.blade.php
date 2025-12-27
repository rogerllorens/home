@props(['items'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->faqPage($items))
<x-schema.script :data="$schema" />
