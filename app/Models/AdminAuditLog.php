<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AdminAuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public static function record(string $action, array $meta = []): void
    {
        $userId = Auth::id();

        self::create([
            'user_id' => $userId,
            'action' => $action,
            'meta' => $meta,
        ]);
    }
}
