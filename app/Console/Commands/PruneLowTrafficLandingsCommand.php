<?php

namespace App\Console\Commands;

use App\Models\LandingPageview;
use App\Models\SearchLanding;
use App\Services\Search\SearchLandingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneLowTrafficLandingsCommand extends Command
{
    protected $signature = 'landings:prune-low-traffic {--min-views=10} {--min-videos=8}';
    protected $description = 'Disable low-performing search landings';

    public function handle(SearchLandingService $landingService): int
    {
        $minViews = (int) $this->option('min-views');
        $minVideos = (int) $this->option('min-videos');
        $cutoff = now()->subDays(30);

        $landingIds = LandingPageview::query()
            ->select('search_landing_id', DB::raw('count(*) as total'))
            ->where('viewed_at', '>=', $cutoff)
            ->groupBy('search_landing_id')
            ->pluck('total', 'search_landing_id');

        $landings = SearchLanding::query()
            ->where('is_public', true)
            ->get();

        $pruned = 0;
        foreach ($landings as $landing) {
            $views = (int) ($landingIds[$landing->id] ?? 0);
            $videosCount = $landingService->countForQuery($landing->query);

            if ($views < $minViews && $videosCount < $minVideos) {
                $landing->update(['is_public' => false, 'videos_count' => $videosCount]);
                $pruned++;
            }
        }

        $this->info("Pruned {$pruned} landings.");

        return self::SUCCESS;
    }
}
