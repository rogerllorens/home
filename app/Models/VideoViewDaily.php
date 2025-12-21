<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoViewDaily extends Model
{
    use HasFactory;

    protected $fillable = [
        'video_id',
        'day',
        'views',
    ];

    protected $casts = [
        'day' => 'date',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
