<?php

namespace App\Models;

use App\Casts\PostgresTextArray;
use App\Enums\VideoStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Laravel\Scout\Searchable;

class Video extends Model
{
    use HasFactory;
    use Searchable;

    protected $fillable = [
        'source_id',
        'external_id',
        'title',
        'seo_title',
        'description',
        'seo_description',
        'embed_url',
        'embed_html',
        'thumbnail_url',
        'duration_seconds',
        'status',
        'category_slug',
        'raw_title',
        'raw_description',
        'raw_tags',
        'seo_tags',
        'language',
        'embed_failures',
        'embed_ok',
        'duplicate_count',
        'source_url',
        'published_at',
        'ai_checked_at',
        'ai_quality',
        'embed_checked_at',
        'embed_last_ok_at',
        'embed_next_check_at',
    ];

    protected $casts = [
        'status' => VideoStatus::class,
        'raw_tags' => PostgresTextArray::class,
        'seo_tags' => PostgresTextArray::class,
        'embed_ok' => 'boolean',
        'duration_seconds' => 'integer',
        'duplicate_count' => 'integer',
        'published_at' => 'datetime',
        'ai_checked_at' => 'datetime',
        'embed_checked_at' => 'datetime',
        'embed_last_ok_at' => 'datetime',
        'embed_next_check_at' => 'datetime',
    ];

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }

    public function viewsDaily(): HasMany
    {
        return $this->hasMany(VideoViewDaily::class);
    }

    public function takedowns(): HasMany
    {
        return $this->hasMany(Takedown::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', VideoStatus::Published->value);
    }

    public function scopeReady(Builder $query): Builder
    {
        return $query
            ->where('status', VideoStatus::Ready->value)
            ->whereNotNull('embed_checked_at')
            ->whereNotNull('ai_checked_at');
    }

    public function scopeNeedsAi(Builder $query): Builder
    {
        return $query->whereNull('ai_checked_at');
    }

    public function scopeNeedsEmbedCheck(Builder $query): Builder
    {
        return $query->where(function (Builder $subQuery) {
            $subQuery->whereNull('embed_checked_at')
                ->orWhere('embed_next_check_at', '<=', Carbon::now());
        });
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === VideoStatus::Published;
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'seo_tags' => $this->seo_tags ?? [],
            'category_slug' => $this->category_slug,
            'published_at' => optional($this->published_at)->toAtomString(),
            'quality_score' => $this->quality_score,
        ];
    }

    public function getSeoTitleAttribute(): ?string
    {
        return $this->attributes['seo_title'] ?? $this->attributes['title'] ?? null;
    }

    public function getSeoDescriptionAttribute(): ?string
    {
        return $this->attributes['seo_description'] ?? $this->attributes['description'] ?? null;
    }

    public function getQualityScoreAttribute(): int
    {
        return (int) ($this->attributes['quality_score'] ?? $this->attributes['ai_quality'] ?? 0);
    }

    public function getEmbedLastCheckedAtAttribute(): ?\Illuminate\Support\Carbon
    {
        return $this->embed_checked_at;
    }

    public function getEmbedLastOkAtAttribute(): ?\Illuminate\Support\Carbon
    {
        return $this->embed_last_ok_at;
    }
}
