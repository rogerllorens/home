<?php

namespace App\Models;

use App\Casts\PostgresTextArray;
use App\Enums\VideoModerationStatus;
use App\Enums\VideoStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'quarantine_reason',
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
        'import_error_reason',
        'published_at',
        'ai_checked_at',
        'ai_quality',
        'embed_checked_at',
        'embed_last_ok_at',
        'embed_next_check_at',
        'moderation_status',
        'moderation_reviewed_at',
        'moderation_reviewed_by',
        'is_featured',
        'is_manual_upload',
        'has_takedown_contact',
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
        'moderation_status' => VideoModerationStatus::class,
        'moderation_reviewed_at' => 'datetime',
        'moderation_reviewed_by' => 'integer',
        'is_featured' => 'boolean',
        'is_manual_upload' => 'boolean',
        'has_takedown_contact' => 'boolean',
    ];

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }

    public function viewsDaily(): HasMany
    {
        return $this->hasMany(VideoViewDaily::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(VideoLike::class);
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class, 'collection_video')
            ->withTimestamps();
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_video')
            ->withTimestamps();
    }

    public function takedowns(): HasMany
    {
        return $this->hasMany(Takedown::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', VideoStatus::Published->value)
            ->where('moderation_status', VideoModerationStatus::Approved->value);
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
        return $this->status === VideoStatus::Published
            && $this->moderation_status === VideoModerationStatus::Approved
            && !app()->environment('testing');
    }

    public function transparencyTagKeys(): array
    {
        $tags = [];

        if ($this->source?->is_verified) {
            $tags[] = 'verified_source';
        }

        if ($this->moderation_status === VideoModerationStatus::Approved) {
            $tags[] = 'moderation_reviewed';
        }

        if ($this->is_manual_upload) {
            $tags[] = 'manual_upload';
        } else {
            $tags[] = 'auto_imported';
        }

        if ($this->has_takedown_contact) {
            $tags[] = 'fast_takedown';
        }

        return $tags;
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

    public function getDisplayViewsAttribute(): ?int
    {
        $candidates = [
            'views_total',
            'views',
            'views_daily',
            'views_daily_sum_views',
        ];

        foreach ($candidates as $field) {
            $value = $this->getAttribute($field);
            if (is_numeric($value) && (int) $value > 0) {
                return (int) $value;
            }
        }

        return null;
    }

    public function getDisplayLikesAttribute(): ?int
    {
        $value = $this->getAttribute('likes_count');
        if (is_numeric($value) && (int) $value >= 0) {
            return (int) $value;
        }

        return null;
    }
}
