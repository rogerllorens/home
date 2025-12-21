<?php

namespace App\Models;

use App\Enums\TakedownStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Takedown extends Model
{
    use HasFactory;

    protected $fillable = [
        'video_id',
        'status',
        'reason',
        'notes',
        'requested_at',
        'resolved_at',
    ];

    protected $casts = [
        'status' => TakedownStatus::class,
        'requested_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}
