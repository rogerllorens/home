<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Collection extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'is_public',
        'is_auto_managed',
        'language',
        'pageviews_last_30d',
        'ctr_affiliate_last_30d',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_auto_managed' => 'boolean',
    ];

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class, 'collection_video')
            ->withPivot('position')
            ->withTimestamps();
    }
}
