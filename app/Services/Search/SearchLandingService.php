<?php

namespace App\Services\Search;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SearchLandingService
{
    public function videosForQuery(string $query, int $limit = 60): Collection
    {
        $builder = $this->baseQuery($query);

        return $builder
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->limit($limit)
            ->get();
    }

    public function countForQuery(string $query): int
    {
        return $this->baseQuery($query)->count();
    }

    private function baseQuery(string $query): Builder
    {
        $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

        return Video::query()
            ->where('status', VideoStatus::Published->value)
            ->where(function (Builder $builder) use ($query, $operator) {
                $builder->where('seo_title', $operator, "%{$query}%")
                    ->orWhere('title', $operator, "%{$query}%")
                    ->orWhere('seo_description', $operator, "%{$query}%")
                    ->orWhere('description', $operator, "%{$query}%")
                    ->orWhere('category_slug', $operator, "%{$query}%");

                if (DB::getDriverName() === 'pgsql') {
                    $builder->orWhereRaw('raw_tags && ARRAY[?]::text[]', [$query]);
                }
            })
            ->orderByDesc('published_at');
    }
}
