<?php

namespace App\Console\Commands;

use App\Services\Seo\SeoHealthChecker;
use Illuminate\Console\Command;

class SeoHealthCheckCommand extends Command
{
    protected $signature = 'seo:health-check';
    protected $description = 'Run SEO health checks and log issues';

    public function handle(SeoHealthChecker $checker): int
    {
        $issues = $checker->run();

        $this->info("Detected {$issues->count()} SEO issues.");

        return self::SUCCESS;
    }
}
