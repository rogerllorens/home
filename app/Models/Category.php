<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'normalized_name',
        'parent_id',
        'is_auto_managed',
        'is_public',
        'language',
        'pageviews_last_30d',
        'ctr_affiliate_last_30d',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class, 'category_video')
            ->withTimestamps();
    }
}
