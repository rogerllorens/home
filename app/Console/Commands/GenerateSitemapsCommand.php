<?php

namespace App\Console\Commands;

use App\Services\Sitemaps\TaxonomySitemapGenerator;
use App\Services\Sitemaps\SearchLandingSitemapGenerator;
use App\Services\Sitemaps\VideoSitemapGenerator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;

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

        try {
            $videoGenerator = new VideoSitemapGenerator();
            $taxonomyGenerator = new TaxonomySitemapGenerator();
            $landingGenerator = new SearchLandingSitemapGenerator();

            $sitemapFiles = array_merge(
                $videoGenerator->generate($directory),
                $taxonomyGenerator->generate($directory),
                $landingGenerator->generate($directory)
            );
        } finally {
            $lock->release();
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
