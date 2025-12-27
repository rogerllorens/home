@props(['items'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->breadcrumbs($items))
<x-schema.script :data="$schema" />
