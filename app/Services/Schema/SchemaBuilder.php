<?php

namespace App\Services\Schema;

use App\Models\Entity;
use App\Models\Video;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Support\Collection;

class SchemaBuilder
{
    public function breadcrumbs(array $items): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => collect($items)->values()->map(function ($item, $index) {
                return [
                    '@type' => 'ListItem',
                    'position' => $index + 1,
                    'name' => $item['name'],
                    'item' => $item['item'],
                ];
            })->all(),
        ];
    }

    public function itemList(iterable $videos): array
    {
        $videoCollection = match (true) {
            $videos instanceof Collection => $videos,
            $videos instanceof AbstractPaginator => collect($videos->items()),
            default => collect($videos),
        };

        return [
            '@context' => 'https://schema.org',
            '@type' => 'ItemList',
            'itemListElement' => $videoCollection->values()->map(function (Video $video, int $index) {
                return [
                    '@type' => 'ListItem',
                    'position' => $index + 1,
                    'url' => route('public.video', [
                        'slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title),
                        'id' => $video->id,
                    ]),
                    'name' => $video->seo_title ?: $video->title,
                ];
            })->all(),
        ];
    }

    public function video(Video $video): array
    {
        $durationSeconds = (int) ($video->duration_seconds ?? 0);
        $duration = null;
        if ($durationSeconds > 0) {
            $minutes = intdiv($durationSeconds, 60);
            $seconds = $durationSeconds % 60;
            $duration = "PT{$minutes}M{$seconds}S";
        }

        $views = $video->display_views;

        return [
            '@context' => 'https://schema.org',
            '@type' => 'VideoObject',
            'name' => $video->seo_title ?: $video->title,
            'description' => $video->seo_description ?: $video->description,
            'thumbnailUrl' => $video->thumbnail_url ? [$video->thumbnail_url] : [],
            'uploadDate' => optional($video->published_at)->toAtomString(),
            'duration' => $duration,
            'url' => route('public.video', [
                'slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title),
                'id' => $video->id,
            ]),
            'interactionStatistic' => $views === null ? null : [
                '@type' => 'InteractionCounter',
                'interactionType' => [
                    '@type' => 'WatchAction',
                ],
                'userInteractionCount' => $views,
            ],
        ];
    }

    /**
     * @param array<int, array{question: string, answer: string}> $items
     */
    public function faqPage(array $items): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => collect($items)->map(fn ($item) => [
                '@type' => 'Question',
                'name' => $item['question'],
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $item['answer'],
                ],
            ])->all(),
        ];
    }

    public function entity(Entity $entity): array
    {
        $schemaType = in_array($entity->type, ['category', 'concept', 'theme'], true) ? 'DefinedTerm' : 'Thing';

        return [
            '@context' => 'https://schema.org',
            '@type' => $schemaType,
            '@id' => route('public.entity', $entity->slug),
            'name' => $entity->name,
            'description' => $entity->description,
            'url' => route('public.entity', $entity->slug),
        ];
    }

    public function article(array $article, string $url): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $article['title'] ?? '',
            'description' => $article['summary'] ?? '',
            'url' => $url,
        ];
    }

    public function webPage(string $name, string $description, string $url): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => $name,
            'description' => $description,
            'url' => $url,
        ];
    }
}
