@props(['videos'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->itemList($videos))
<x-schema.script :data="$schema" />
