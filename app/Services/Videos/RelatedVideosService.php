<?php

namespace App\Services\Videos;

use App\Models\Video;
use Illuminate\Support\Collection;

class RelatedVideosService
{
    public function related(Video $video, int $limit = 48): Collection
    {
        $tags = $video->raw_tags ?? [];
        $related = collect();

        $appendRelated = function ($query) use (&$related, $limit, $video): void {
            if ($related->count() >= $limit) {
                return;
            }

            $results = $query
                ->where('id', '!=', $video->id)
                ->whereNotIn('id', $related->pluck('id'))
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('published_at')
                ->take($limit - $related->count())
                ->get();

            $related = $related->concat($results);
        };

        if ($video->category_slug && !empty($tags)) {
            $appendRelated(
                Video::published()
                    ->where('category_slug', $video->category_slug)
                    ->whereRaw('raw_tags && ?', ['{' . implode(',', $tags) . '}'])
            );
        }

        if ($video->category_slug) {
            $appendRelated(
                Video::published()->where('category_slug', $video->category_slug)
            );
        }

        $appendRelated(Video::published());

        return $related->take($limit);
    }
}
