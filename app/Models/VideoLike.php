<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoLike extends Model
{
    protected $fillable = [
        'video_id',
        'device_hash',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
