<?php

namespace App\Services\Sitemaps;

use App\Models\TopicCluster;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

class TopicClusterSitemapGenerator
{
    /**
     * @return array<int, string>
     */
    public function generate(string $directory): array
    {
        $clusters = TopicCluster::query()
            ->where('is_public', true)
            ->orderBy('slug')
            ->get();

        if ($clusters->isEmpty()) {
            return [];
        }

        $chunks = $clusters->chunk(5000);
        $files = [];

        foreach ($chunks as $index => $chunk) {
            $entries = $chunk->map(function (TopicCluster $cluster) {
                $loc = route('public.theme', $cluster->slug);
                $lastmod = $cluster->updated_at ? Carbon::parse($cluster->updated_at)->toAtomString() : null;
                $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';

                return "<url><loc>{$loc}</loc>{$lastmodTag}</url>";
            })->implode('');

            $file = 'themes-' . ($index + 1) . '.xml';
            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$entries}</urlset>";
            File::put("{$directory}/{$file}", $xml);
            $files[] = $file;
        }

        return $files;
    }
}
