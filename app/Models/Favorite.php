<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    protected $fillable = [
        'device_hash',
        'video_id',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
