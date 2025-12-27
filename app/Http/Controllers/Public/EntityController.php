<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Entity;
use Illuminate\View\View;

class EntityController extends Controller
{
    public function show(string $locale, string $slug): View
    {
        $entity = Entity::query()
            ->where('slug', $slug)
            ->firstOrFail();

        $videos = $entity->videos()
            ->where('status', VideoStatus::Published->value)
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->orderByDesc('published_at')
            ->take(48)
            ->get();

        $related = $entity->relations()
            ->with('relatedEntity')
            ->get()
            ->pluck('relatedEntity')
            ->filter();

        return view('public.entity', [
            'entity' => $entity,
            'videos' => $videos,
            'relatedEntities' => $related,
        ]);
    }
}
