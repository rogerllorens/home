<?php

namespace Tests\Unit;

use App\Models\SeoMetaVariant;
use App\Models\SeoMetaVariantLog;
use App\Services\Seo\SeoMetaVariantService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class SeoMetaVariantServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_selects_winner_variant_and_logs(): void
    {
        $variant = SeoMetaVariant::create([
            'page_type' => 'category',
            'page_id' => 1,
            'title' => 'Winner title',
            'description' => 'Winner description',
            'weight' => 1,
            'is_winner' => true,
        ]);

        $service = new SeoMetaVariantService();
        $request = Request::create('/test', 'GET', [], [], [], ['HTTP_REFERER' => 'https://www.google.com/search?q=test']);

        $result = $service->select('category', 1, 'Default', 'Default desc', $request);

        $this->assertSame('Winner title', $result['title']);
        $this->assertSame('Winner description', $result['description']);
        $this->assertTrue(SeoMetaVariantLog::query()->where('seo_meta_variant_id', $variant->id)->exists());
    }
}
