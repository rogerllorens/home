<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TopicCluster extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'h1',
        'h2',
        'intro',
        'hero_image_url',
        'category_slugs',
        'tag_slugs',
        'is_public',
        'is_discover_candidate',
        'language',
    ];

    protected $casts = [
        'category_slugs' => AsArrayObject::class,
        'tag_slugs' => AsArrayObject::class,
        'is_public' => 'boolean',
        'is_discover_candidate' => 'boolean',
    ];
}
