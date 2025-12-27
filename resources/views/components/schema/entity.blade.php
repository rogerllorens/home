@props(['entity'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->entity($entity))
<x-schema.script :data="$schema" />
