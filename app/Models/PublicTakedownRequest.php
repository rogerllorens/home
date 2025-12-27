<?php

namespace App\Models;

use App\Enums\PublicTakedownStatus;
use Illuminate\Database\Eloquent\Model;

class PublicTakedownRequest extends Model
{
    protected $fillable = [
        'url',
        'email',
        'requester_name',
        'reason',
        'notes',
        'status',
        'reviewed_at',
        'resolved_at',
        'handled_by',
        'referrer',
        'ip_hash',
        'user_agent_hash',
    ];

    protected $casts = [
        'status' => PublicTakedownStatus::class,
        'reviewed_at' => 'datetime',
        'resolved_at' => 'datetime',
        'handled_by' => 'integer',
    ];
}
