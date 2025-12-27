<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoPageMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_type',
        'page_id',
        'url',
        'last_content_refresh_at',
        'views_recent',
        'views_previous',
        'is_stale',
        'last_checked_at',
    ];

    protected $casts = [
        'last_content_refresh_at' => 'datetime',
        'last_checked_at' => 'datetime',
        'is_stale' => 'boolean',
    ];
}
