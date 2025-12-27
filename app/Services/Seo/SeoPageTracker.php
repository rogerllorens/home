<?php

namespace App\Services\Seo;

use App\Models\SeoPageView;
use Illuminate\Http\Request;

class SeoPageTracker
{
    public function track(string $pageType, ?int $pageId, Request $request): void
    {
        SeoPageView::create([
            'page_type' => $pageType,
            'page_id' => $pageId,
            'url' => $request->fullUrl(),
            'referrer' => $request->headers->get('referer'),
            'viewed_at' => now(),
        ]);
    }
}
