<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Services\Seo\SeoHealthChecker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoHealthCheckerTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_checker_records_missing_description(): void
    {
        Category::create([
            'name' => 'Sports',
            'slug' => 'sports',
            'normalized_name' => 'sports',
            'is_public' => true,
        ]);

        config()->set('candidboys.seo.title_min', 100);

        $issues = app(SeoHealthChecker::class)->run();

        $this->assertTrue($issues->contains('issue_type', 'title_length'));
    }
}
