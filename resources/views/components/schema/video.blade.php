@props(['video'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->video($video))
<x-schema.script :data="$schema" />
