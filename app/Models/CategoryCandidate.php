<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryCandidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'source',
        'normalized_name',
        'videos_count',
        'hits_last_30d',
        'status',
        'is_subcategory',
        'parent_category_id',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_category_id');
    }
}
