<?php

namespace App\Models;

use App\Enums\JourneyStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Journey extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'slug',
        'status',
    ];

    protected $casts = [
        'status' => JourneyStatus::class,
    ];

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class, 'journey_video')
            ->withPivot('position')
            ->orderBy('journey_video.position');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', JourneyStatus::Published->value);
    }
}
