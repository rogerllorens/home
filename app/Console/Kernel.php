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
    }
}
