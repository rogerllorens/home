<?php

namespace App\Services\Videos;

use App\Enums\VideoStatus;
use App\Models\Video;

class VideoAvailabilityPolicy
{
    public function isIndexable(Video $video): bool
    {
        return $video->status === VideoStatus::Published
            && !empty($video->seo_title)
            && !empty($video->seo_description)
            && $video->embed_ok;
    }

    public function isUnavailable(Video $video): bool
    {
        return in_array($video->status, [VideoStatus::Broken, VideoStatus::Quarantine], true) || !$video->embed_ok;
    }
}
