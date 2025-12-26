<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    protected $fillable = [
        'event_name',
        'properties',
        'device_hash',
        'locale',
        'path',
        'referrer',
        'ip_hash',
        'user_agent_hash',
        'occurred_at',
    ];

    protected $casts = [
        'properties' => 'array',
        'occurred_at' => 'datetime',
    ];
}
