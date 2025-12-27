<?php

namespace App\Console\Commands;

use App\Services\Seo\SeoDecayService;
use Illuminate\Console\Command;

class DetectContentDecayCommand extends Command
{
    protected $signature = 'seo:detect-decay {--refresh}';
    protected $description = 'Detect stale SEO pages and optionally refresh them';

    public function handle(SeoDecayService $service): int
    {
        $stalePages = $service->analyze();

        if ($stalePages->isEmpty()) {
            $this->info('No stale SEO pages detected.');
            return self::SUCCESS;
        }

        $this->info("Detected {$stalePages->count()} stale SEO pages.");

        if ($this->option('refresh')) {
            foreach ($stalePages as $metric) {
                $service->refresh($metric);
            }

            $this->info('Stale pages refreshed.');
        }

        return self::SUCCESS;
    }
}
