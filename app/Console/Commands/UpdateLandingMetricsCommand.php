<?php

namespace App\Console\Commands;

use App\Models\LandingPageview;
use App\Models\SearchLanding;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateLandingMetricsCommand extends Command
{
    protected $signature = 'landings:metrics {--limit=1000}';
    protected $description = 'Update landing metrics based on recent activity';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $cutoff = now()->subDays(30);

        $landingIds = SearchLanding::query()
            ->where('is_public', true)
            ->limit($limit)
            ->pluck('id')
            ->all();

        if (empty($landingIds)) {
            $this->info('No public landings found.');
            return self::SUCCESS;
        }

        $pageviews = LandingPageview::query()
            ->select('search_landing_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->whereIn('search_landing_id', $landingIds)
            ->groupBy('search_landing_id')
            ->pluck('total', 'search_landing_id');

        $updated = 0;
        foreach ($landingIds as $landingId) {
            $count = (int) ($pageviews[$landingId] ?? 0);
            $updated += SearchLanding::query()
                ->whereKey($landingId)
                ->update([
                    'pageviews_last_30d' => $count,
                    'ctr_affiliate_last_30d' => 0,
                    'avg_position_guess' => null,
                ]);
        }

        $this->info("Updated metrics for {$updated} landings.");

        return self::SUCCESS;
    }
}
