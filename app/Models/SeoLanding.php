<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoLanding extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'type',
        'params',
        'title_template',
        'description_template',
        'faq_template',
        'is_public',
        'videos_count',
        'language',
    ];

    protected $casts = [
        'params' => AsArrayObject::class,
        'faq_template' => 'array',
        'is_public' => 'boolean',
        'videos_count' => 'integer',
    ];
}
