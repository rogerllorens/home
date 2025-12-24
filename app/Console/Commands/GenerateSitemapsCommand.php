<?php

namespace App\Console\Commands;

use App\Models\Video;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GenerateSitemapsCommand extends Command
{
    protected $signature = 'sitemaps:generate';
    protected $description = 'Generate sitemap index and video sitemaps';

    public function handle(): int
    {
        $lock = Cache::lock('pipeline:daily', 3600);
        if (!$lock->get()) {
            $this->info('Pipeline lock active, skipping sitemap generation.');
            return self::SUCCESS;
        }

        $directory = public_path('sitemaps');
        File::ensureDirectoryExists($directory);

        $videos = Video::query()
            ->where('status', \App\Enums\VideoStatus::Published)
            ->whereNotNull('seo_title')
            ->whereNotNull('seo_description')
            ->where('embed_ok', true)
            ->orderBy('id');
        $chunkSize = 20000;
        $fileIndex = 1;
        $sitemapFiles = [];

        try {
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
        } finally {
            $lock->release();
        }

        $categoryEntries = DB::table('videos')
            ->select('category_slug', DB::raw('max(updated_at) as lastmod'))
            ->whereNotNull('category_slug')
            ->where('status', \App\Enums\VideoStatus::Published->value)
            ->whereNotNull('seo_title')
            ->whereNotNull('seo_description')
            ->where('embed_ok', true)
            ->groupBy('category_slug')
            ->get()
            ->map(function ($row) {
                $loc = route('public.category', $row->category_slug);
                $lastmod = $row->lastmod ? \Illuminate\Support\Carbon::parse($row->lastmod)->toAtomString() : null;
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
        ", [\App\Enums\VideoStatus::Published->value]);

        if (!empty($tagRows)) {
            $tagEntries = collect($tagRows)->map(function ($row) {
                $loc = route('public.tag', $row->tag);
                $lastmod = $row->lastmod ? \Illuminate\Support\Carbon::parse($row->lastmod)->toAtomString() : null;
                $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';
                return "<url><loc>{$loc}</loc>{$lastmodTag}</url>";
            })->implode('');

            $tagFile = 'tags-1.xml';
            $sitemapFiles[] = $tagFile;
            $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{$tagEntries}</urlset>";
            File::put("{$directory}/{$tagFile}", $xml);
        }

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
