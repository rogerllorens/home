<?php

namespace App\Services\Sitemaps;

use App\Casts\PostgresTextArray;
use App\Enums\VideoStatus;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class TaxonomySitemapGenerator
{
    /**
     * @return array<int, string>
     */
    public function generate(string $directory): array
    {
        $sitemapFiles = [];

        $categoryEntries = DB::table('videos')
            ->select('category_slug', DB::raw('max(updated_at) as lastmod'))
            ->whereNotNull('category_slug')
            ->where('status', VideoStatus::Published->value)
            ->whereNotNull('seo_title')
            ->whereNotNull('seo_description')
            ->where('embed_ok', true)
            ->groupBy('category_slug')
            ->get()
            ->map(function ($row) {
                $loc = route('public.category', $row->category_slug);
                $lastmod = $row->lastmod ? Carbon::parse($row->lastmod)->toAtomString() : null;
                $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';
                return "<url><loc>{$loc}</loc>{$lastmodTag}</url>";
            })
            ->implode('');

        if ($categoryEntries !== '') {
            $categoryFile = 'categories-1.xml';
            $sitemapFiles[] = $categoryFile;
            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$categoryEntries}</urlset>";
            File::put("{$directory}/{$categoryFile}", $xml);
        }

        if (DB::getDriverName() === 'pgsql') {
            $tagRows = DB::select("
                SELECT tag, MAX(updated_at) as lastmod
                FROM (
                    SELECT unnest(raw_tags) as tag, updated_at
                    FROM videos
                    WHERE status = ? AND seo_title IS NOT NULL AND seo_description IS NOT NULL AND embed_ok = true
                ) as tags
                WHERE tag IS NOT NULL AND tag <> ''
                GROUP BY tag
                ORDER BY tag
            ", [VideoStatus::Published->value]);
        } else {
            $rows = DB::table('videos')
                ->select('raw_tags', 'updated_at')
                ->where('status', VideoStatus::Published->value)
                ->whereNotNull('seo_title')
                ->whereNotNull('seo_description')
                ->where('embed_ok', true)
                ->get();

            $caster = new PostgresTextArray();
            $tagMap = [];

            foreach ($rows as $row) {
                $tags = $caster->get(null, 'raw_tags', $row->raw_tags, []);
                foreach ($tags as $tag) {
                    $tag = trim((string) $tag);
                    if ($tag === '') {
                        continue;
                    }

                    $lastmod = Carbon::parse($row->updated_at);
                    if (!isset($tagMap[$tag]) || $lastmod->gt($tagMap[$tag])) {
                        $tagMap[$tag] = $lastmod;
                    }
                }
            }

            ksort($tagMap);
            $tagRows = array_map(
                fn ($tag, $lastmod) => (object) ['tag' => $tag, 'lastmod' => $lastmod],
                array_keys($tagMap),
                $tagMap
            );
        }

        if (!empty($tagRows)) {
            $tagEntries = collect($tagRows)->map(function ($row) {
                $loc = route('public.tag', $row->tag);
                $lastmod = $row->lastmod ? Carbon::parse($row->lastmod)->toAtomString() : null;
                $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';
                return "<url><loc>{$loc}</loc>{$lastmodTag}</url>";
            })->implode('');

            $tagFile = 'tags-1.xml';
            $sitemapFiles[] = $tagFile;
            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$tagEntries}</urlset>";
            File::put("{$directory}/{$tagFile}", $xml);
        }

        return $sitemapFiles;
    }
}
