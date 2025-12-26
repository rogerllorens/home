<?php

namespace App\Services\Sitemaps;

use App\Models\SearchLanding;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

class SearchLandingSitemapGenerator
{
    /**
     * @return array<int, string>
     */
    public function generate(string $directory): array
    {
        $entries = SearchLanding::query()
            ->where('is_public', true)
            ->orderBy('slug')
            ->get()
            ->map(function (SearchLanding $landing) {
                $loc = route('public.discover', $landing->slug);
                $lastmod = $landing->updated_at ? Carbon::parse($landing->updated_at)->toAtomString() : null;
                $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';

                return "<url><loc>{$loc}</loc>{$lastmodTag}</url>";
            })
            ->implode('');

        if ($entries === '') {
            return [];
        }

        $file = 'discover-1.xml';
        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
        $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$entries}</urlset>";
        File::put("{$directory}/{$file}", $xml);

        return [$file];
    }
}
