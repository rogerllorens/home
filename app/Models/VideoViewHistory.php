<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoViewHistory extends Model
{
    protected $fillable = [
        'device_hash',
        'video_id',
        'last_watched_at',
        'last_position_seconds',
    ];

    protected $casts = [
        'last_watched_at' => 'datetime',
        'last_position_seconds' => 'integer',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
