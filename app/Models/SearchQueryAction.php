<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchQueryAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'normalized_query',
        'status',
        'notes',
    ];
}
