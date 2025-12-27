<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeoMetaVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_type',
        'page_id',
        'title',
        'description',
        'weight',
        'is_winner',
    ];

    protected $casts = [
        'is_winner' => 'boolean',
        'weight' => 'integer',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(SeoMetaVariantLog::class, 'seo_meta_variant_id');
    }
}
