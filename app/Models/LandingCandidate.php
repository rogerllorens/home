<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LandingCandidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'query',
        'slug',
        'hits_last_30d',
        'videos_count',
        'status',
    ];
}
