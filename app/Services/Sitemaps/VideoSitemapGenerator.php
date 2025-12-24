<?php

namespace App\Services\Sitemaps;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class VideoSitemapGenerator
{
    /**
     * @return array<int, string>
     */
    public function generate(string $directory, int $chunkSize = 20000): array
    {
        $videos = Video::query()
            ->where('status', VideoStatus::Published)
            ->whereNotNull('seo_title')
            ->whereNotNull('seo_description')
            ->where('embed_ok', true)
            ->orderBy('id');

        $fileIndex = 1;
        $sitemapFiles = [];

        $videos->chunk($chunkSize, function ($chunk) use (&$fileIndex, &$sitemapFiles, $directory) {
            $filename = "videos-{$fileIndex}.xml";
            $sitemapFiles[] = $filename;
            $fileIndex++;

            $entries = $chunk->map(function (Video $video) {
                $slug = Str::slug($video->seo_title ?: $video->title);
                $loc = route('public.video', ['slug' => $slug, 'id' => $video->id]);
                $lastmod = $video->updated_at?->toAtomString();

                return "<url><loc>{$loc}</loc><lastmod>{$lastmod}</lastmod></url>";
            })->implode('');

            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$entries}</urlset>";

            File::put("{$directory}/{$filename}", $xml);
        });

        return $sitemapFiles;
    }
}
