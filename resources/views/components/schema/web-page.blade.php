@props(['name', 'description', 'url'])
@php($schema = app(\App\Services\Schema\SchemaBuilder::class)->webPage($name, $description, $url))
<x-schema.script :data="$schema" />
