<?php

namespace App\Services\Seo;

use App\Models\TopicCluster;
use Illuminate\Support\Collection;

class TopicClusterMatcher
{
    /**
     * @return Collection<int, TopicCluster>
     */
    public function all(): Collection
    {
        return TopicCluster::query()
            ->where('is_public', true)
            ->orderBy('name')
            ->get();
    }

    public function forCategory(?string $categorySlug): ?TopicCluster
    {
        if (!$categorySlug) {
            return null;
        }

        return $this->all()->first(function (TopicCluster $cluster) use ($categorySlug) {
            return in_array($categorySlug, $this->normalizeSlugs($cluster->category_slugs ?? []), true);
        });
    }

    public function forTag(?string $tag): ?TopicCluster
    {
        if (!$tag) {
            return null;
        }

        return $this->all()->first(function (TopicCluster $cluster) use ($tag) {
            return in_array($tag, $this->normalizeSlugs($cluster->tag_slugs ?? []), true);
        });
    }

    public function forVideoTags(array $tags): ?TopicCluster
    {
        if (empty($tags)) {
            return null;
        }

        return $this->all()->first(function (TopicCluster $cluster) use ($tags) {
            $clusterTags = $this->normalizeSlugs($cluster->tag_slugs ?? []);
            return !empty(array_intersect($clusterTags, $tags));
        });
    }

    /**
     * @param iterable<int, string> $slugs
     * @return array<int, string>
     */
    private function normalizeSlugs(iterable $slugs): array
    {
        return collect($slugs)->filter()->values()->all();
    }
}
