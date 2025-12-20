<?php

namespace App\Console\Commands;

use App\Models\Video;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class GenerateSitemapsCommand extends Command
{
    protected $signature = 'sitemaps:generate';
    protected $description = 'Generate sitemap index and video sitemaps';

    public function handle(): int
    {
        $directory = public_path('sitemaps');
        File::ensureDirectoryExists($directory);

        $videos = Video::published()->orderBy('id');
        $chunkSize = 20000;
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

        $indexEntries = collect($sitemapFiles)->map(function ($file) {
            $loc = url("/sitemaps/{$file}");
            return "<sitemap><loc>{$loc}</loc></sitemap>";
        })->implode('');

        $indexXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
        $indexXml .= "<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$indexEntries}</sitemapindex>";

        File::put("{$directory}/index.xml", $indexXml);

        $this->info('Sitemaps generated.');

        return self::SUCCESS;
    }
}
