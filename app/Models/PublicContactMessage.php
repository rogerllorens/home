<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicContactMessage extends Model
{
    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'referrer',
        'ip_hash',
        'user_agent_hash',
    ];
}
