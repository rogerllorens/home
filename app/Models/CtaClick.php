<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CtaClick extends Model
{
    protected $fillable = [
        'video_id',
        'cta_key',
        'placement',
        'referrer',
        'ip_hash',
        'user_agent_hash',
        'click_id',
        'destination_url',
        'category_slug',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
