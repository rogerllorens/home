<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entity extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
    ];

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class, 'entity_video')->withTimestamps();
    }

    public function relations(): HasMany
    {
        return $this->hasMany(EntityRelation::class, 'entity_id');
    }
}
