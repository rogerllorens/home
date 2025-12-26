<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchQuery extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'query',
        'normalized_query',
        'results_count',
        'device_hash',
        'created_at',
    ];
}
