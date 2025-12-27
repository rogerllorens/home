<?php

namespace App\Services\Seo;

use App\Models\Category;
use App\Models\SeoLanding;
use App\Models\TopicCluster;
use App\Models\Video;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InternalLinkingService
{
    public function linkify(string $text, array $context = []): string
    {
        $text = trim($text);
        if ($text === '') {
            return $text;
        }

        $candidates = $this->candidates($context);
        $maxLinks = (int) config('seo_internal_links.max_links', 3);
        $minLength = (int) config('seo_internal_links.min_word_length', 4);
        $used = [];
        $linksAdded = 0;

        $escaped = e($text);
        $parts = preg_split('/(<[^>]+>)/', $escaped, -1, PREG_SPLIT_DELIM_CAPTURE);

        foreach ($parts as $index => $part) {
            if ($linksAdded >= $maxLinks) {
                break;
            }

            if (str_starts_with($part, '<')) {
                continue;
            }

            foreach ($candidates as $candidate) {
                if ($linksAdded >= $maxLinks) {
                    break;
                }

                $label = $candidate['label'];
                if (mb_strlen($label) < $minLength) {
                    continue;
                }

                $key = $candidate['url'];
                if (isset($used[$key])) {
                    continue;
                }

                $pattern = '/\b' . preg_quote($label, '/') . '\b/iu';
                if (!preg_match($pattern, $part)) {
                    continue;
                }

                $replacement = '<a class="font-semibold text-indigo-200 hover:text-indigo-100" href="' . e($candidate['url']) . '">' . $label . '</a>';
                $part = preg_replace($pattern, $replacement, $part, 1);
                $used[$key] = true;
                $linksAdded++;
            }

            $parts[$index] = $part;
        }

        return implode('', $parts);
    }

    private function candidates(array $context): array
    {
        $category = $context['category'] ?? null;
        $tag = $context['tag'] ?? null;

        $categories = Category::query()
            ->where('is_public', true)
            ->orderByDesc('videos_count')
            ->limit(10)
            ->get(['slug', 'name'])
            ->map(fn (Category $cat) => [
                'label' => $cat->name,
                'url' => route('public.category', $cat->slug),
                'type' => 'category',
            ])
            ->all();

        $tags = $this->popularTags(10);

        $themes = TopicCluster::query()
            ->where('is_public', true)
            ->orderBy('name')
            ->limit(5)
            ->get(['slug', 'name'])
            ->map(fn (TopicCluster $cluster) => [
                'label' => $cluster->name,
                'url' => route('public.theme', $cluster->slug),
                'type' => 'theme',
            ])
            ->all();

        $landings = SeoLanding::query()
            ->where('is_public', true)
            ->orderByDesc('videos_count')
            ->limit(5)
            ->get()
            ->map(function (SeoLanding $landing) {
                $url = $landing->type === 'top'
                    ? route('public.seo.top', [
                        'category' => $landing->params['category'] ?? 'all',
                        'duration' => $landing->params['duration'] ?? 'short',
                        'timeframe' => $landing->params['timeframe'] ?? 'this-week',
                    ])
                    : route('public.discover', $landing->slug);

                return [
                    'label' => Str::headline($landing->slug),
                    'url' => $url,
                    'type' => 'landing',
                ];
            })
            ->all();

        $candidates = array_merge($themes, $landings, $categories, $tags);

        if ($category) {
            $candidates = $this->boostContext($candidates, 'category', $category);
        }

        if ($tag) {
            $candidates = $this->boostContext($candidates, 'tag', $tag);
        }

        return $candidates;
    }

    private function boostContext(array $candidates, string $type, string $value): array
    {
        $value = Str::headline($value);

        usort($candidates, function ($a, $b) use ($value) {
            $aMatch = Str::contains(Str::lower($a['label']), Str::lower($value));
            $bMatch = Str::contains(Str::lower($b['label']), Str::lower($value));

            return $aMatch === $bMatch ? 0 : ($aMatch ? -1 : 1);
        });

        return $candidates;
    }

    private function popularTags(int $limit): array
    {
        if (DB::getDriverName() === 'sqlite') {
            return Video::query()
                ->whereNotNull('raw_tags')
                ->get(['raw_tags'])
                ->flatMap(fn (Video $video) => $video->raw_tags ?? [])
                ->countBy()
                ->sortDesc()
                ->take($limit)
                ->keys()
                ->map(fn ($tag) => [
                    'label' => Str::headline($tag),
                    'url' => route('public.tag', $tag),
                    'type' => 'tag',
                ])
                ->values()
                ->all();
        }

        return DB::table('videos')
            ->selectRaw('unnest(raw_tags) as tag, count(*) as total')
            ->whereNotNull('raw_tags')
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'label' => Str::headline($row->tag),
                'url' => route('public.tag', $row->tag),
                'type' => 'tag',
            ])
            ->values()
            ->all();
    }
}
