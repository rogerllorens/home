<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VideoEvent extends Model
{
    protected $fillable = [
        'video_id',
        'event',
        'value',
        'referrer',
        'ip_hash',
        'user_agent_hash',
    ];
}
