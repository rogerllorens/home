<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Services\Seo\InternalLinkingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InternalLinkingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_inserts_links_without_breaking_html(): void
    {
        Category::create([
            'name' => 'Sports',
            'slug' => 'sports',
            'normalized_name' => 'sports',
            'is_public' => true,
        ]);

        $service = new InternalLinkingService();
        $text = 'Explora Sports y más contenido.';
        $result = $service->linkify($text, ['category' => 'sports']);

        $this->assertStringContainsString('<a', $result);
        $this->assertStringContainsString('Sports', $result);
    }
}
