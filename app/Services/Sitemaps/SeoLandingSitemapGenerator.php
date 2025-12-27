<?php

namespace App\Services\Sitemaps;

use App\Models\SeoLanding;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

class SeoLandingSitemapGenerator
{
    /**
     * @return array<int, string>
     */
    public function generate(string $directory): array
    {
        $landings = SeoLanding::query()
            ->where('is_public', true)
            ->orderBy('slug')
            ->get();

        if ($landings->isEmpty()) {
            return [];
        }

        $chunks = $landings->chunk(5000);
        $files = [];

        foreach ($chunks as $index => $chunk) {
            $entries = $chunk->map(function (SeoLanding $landing) {
                $loc = $landing->type === 'top'
                    ? route('public.seo.top', [
                        'category' => $landing->params['category'] ?? 'all',
                        'duration' => $landing->params['duration'] ?? 'short',
                        'timeframe' => $landing->params['timeframe'] ?? 'this-week',
                    ])
                    : route('public.discover', $landing->slug);

                $lastmod = $landing->updated_at ? Carbon::parse($landing->updated_at)->toAtomString() : null;
                $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';

                return "<url><loc>{$loc}</loc>{$lastmodTag}</url>";
            })->implode('');

            $file = 'seo-landings-' . ($index + 1) . '.xml';
            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$entries}</urlset>";
            File::put("{$directory}/{$file}", $xml);
            $files[] = $file;
        }

        return $files;
    }
}
