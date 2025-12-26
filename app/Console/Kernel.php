<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('sources:import')
            ->dailyAt('02:10')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('videos:ai')
            ->everyThirtyMinutes()
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('videos:quality')
            ->dailyAt('03:10')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('videos:publish')
            ->dailyAt('03:30')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('sitemaps:generate')
            ->dailyAt('03:50')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('videos:check-embeds')
            ->hourly()
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('videos:prune-views')
            ->dailyAt('04:30')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('search:prune-queries')
            ->dailyAt('05:00')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('search:detect-popular')
            ->dailyAt('05:15')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('landings:update')
            ->dailyAt('05:30')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('landings:metrics')
            ->dailyAt('05:45')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('landings:prune-low-traffic')
            ->monthlyOn(1, '06:00')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('categories:update-auto')
            ->dailyAt('06:15')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('categories:prune-auto')
            ->monthlyOn(1, '06:30')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('seo:update-landing-metrics')
            ->dailyAt('06:45')
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('seo:soft-prune')
            ->monthlyOn(1, '06:50')
            ->withoutOverlapping()
            ->onOneServer();
    }
}
