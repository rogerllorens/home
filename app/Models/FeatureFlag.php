<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'key',
        'variants',
        'is_active',
    ];

    protected $casts = [
        'variants' => 'array',
        'is_active' => 'boolean',
    ];
}
