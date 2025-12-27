<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoPageView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'page_type',
        'page_id',
        'url',
        'referrer',
        'viewed_at',
    ];
}
