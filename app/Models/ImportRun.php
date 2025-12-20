<?php

namespace App\Models;

use App\Enums\ImportRunStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_id',
        'status',
        'started_at',
        'finished_at',
        'meta',
        'error_message',
    ];

    protected $casts = [
        'status' => ImportRunStatus::class,
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'meta' => 'array',
    ];

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }
}
