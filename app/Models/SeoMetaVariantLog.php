<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoMetaVariantLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'seo_meta_variant_id',
        'page_type',
        'page_id',
        'is_organic',
        'created_at',
    ];

    protected $casts = [
        'is_organic' => 'boolean',
    ];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(SeoMetaVariant::class, 'seo_meta_variant_id');
    }
}
