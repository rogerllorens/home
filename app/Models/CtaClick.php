<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CtaClick extends Model
{
    protected $fillable = [
        'cta_id',
        'video_id',
        'cta_key',
        'placement',
        'cta_variant',
        'landing_type',
        'origin_page',
        'page_url',
        'device_hash',
        'referrer',
        'ip_hash',
        'user_agent_hash',
        'click_id',
        'destination_url',
        'category_slug',
    ];

    public function cta(): BelongsTo
    {
        return $this->belongsTo(Cta::class);
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
