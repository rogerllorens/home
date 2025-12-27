<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CtaImpression extends Model
{
    protected $fillable = [
        'cta_id',
        'video_id',
        'origin_page',
        'page_url',
        'referrer',
        'device_hash',
    ];

    public function cta(): BelongsTo
    {
        return $this->belongsTo(Cta::class);
    }
}
