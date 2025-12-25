<?php

namespace App\Services\Videos;

use App\Models\Video;
use Illuminate\Support\Str;

class VideoSeoService
{
    public function canonicalSlug(Video $video): string
    {
        return Str::slug($video->seo_title ?: $video->title);
    }

    public function robots(Video $video, VideoAvailabilityPolicy $policy): string
    {
        return $policy->isIndexable($video) ? 'index,follow' : 'noindex,follow';
    }
}
