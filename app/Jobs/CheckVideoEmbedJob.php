<?php

namespace App\Jobs;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\Embeds\EmbedChecker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;

class CheckVideoEmbedJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $videoId)
    {
    }

    public function handle(EmbedChecker $checker): void
    {
        $video = Video::find($this->videoId);
        if (!$video) {
            return;
        }

        $timeout = config('candidboys.embed_check.timeout_seconds', 5);
        $maxFailures = config('candidboys.embed_check.max_failures', 3);

        $isOk = $checker->check($video->embed_url, $timeout);
        $failureKey = "embed_failures:{$video->id}";

        $video->embed_checked_at = now();

        if ($isOk) {
            $video->embed_ok = true;
            $video->embed_last_ok_at = now();
            Redis::del($failureKey);
            $video->save();
            return;
        }

        $failures = Redis::incr($failureKey);
        Redis::expire($failureKey, 7 * 24 * 60 * 60);

        $video->embed_ok = false;

        if ($failures >= $maxFailures) {
            $video->status = VideoStatus::Broken;
        }

        $video->save();
    }
}
