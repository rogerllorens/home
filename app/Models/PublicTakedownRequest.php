<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicTakedownRequest extends Model
{
    protected $fillable = [
        'url',
        'email',
        'requester_name',
        'reason',
        'notes',
        'referrer',
        'ip_hash',
        'user_agent_hash',
    ];
}
