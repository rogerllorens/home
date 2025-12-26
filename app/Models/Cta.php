<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cta extends Model
{
    protected $fillable = [
        'public_id',
        'key',
        'type',
        'positions',
        'destination_url',
        'is_active',
    ];

    protected $casts = [
        'positions' => 'array',
        'is_active' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(CtaClick::class);
    }

    public function impressions(): HasMany
    {
        return $this->hasMany(CtaImpression::class);
    }
}
