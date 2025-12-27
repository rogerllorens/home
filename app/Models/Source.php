<?php

namespace App\Models;

use App\Enums\SourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Source extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'feed_url',
        'auth_header',
        'settings',
        'import_schedule_cron',
        'is_active',
        'is_verified',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'type' => SourceType::class,
        'is_verified' => 'boolean',
    ];

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function importRuns(): HasMany
    {
        return $this->hasMany(ImportRun::class);
    }
}
