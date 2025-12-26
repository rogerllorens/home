<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchLanding extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'query',
        'title',
        'description',
        'language',
        'is_public',
        'videos_count',
        'collection_id',
        'pageviews_last_30d',
        'ctr_affiliate_last_30d',
        'avg_position_guess',
    ];

    public function collection(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }
}
