<?php

namespace App\Services;

class CategorySlugNormalizer
{
    public function normalize(?string $slug): string
    {
        $slug = $slug ? trim($slug) : '';
        $categories = config('candidboys.categories_controlled', []);

        if ($slug === '' || !in_array($slug, $categories, true)) {
            return 'real-amateur';
        }

        return $slug;
    }
}
