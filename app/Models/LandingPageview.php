<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPageview extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'search_landing_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function landing(): BelongsTo
    {
        return $this->belongsTo(SearchLanding::class, 'search_landing_id');
    }
}
