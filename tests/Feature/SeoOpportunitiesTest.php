<?php

namespace Tests\Feature;

use App\Models\SearchQuery;
use App\Models\SearchQueryAction;
use App\Models\SeoLanding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoOpportunitiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_seo_opportunities_list_renders(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        SearchQuery::create([
            'query' => 'Summer fun',
            'normalized_query' => 'summer fun',
            'results_count' => 0,
            'device_hash' => 'abc123',
            'created_at' => now(),
        ]);

        SearchQueryAction::create([
            'normalized_query' => 'summer fun',
            'status' => 'ignored',
        ]);

        $response = $this->actingAs($admin)->get(route('admin.seo-opportunities.index'));

        $response->assertOk();
        $response->assertSee('Summer fun');
        $response->assertSee('ignored');
    }

    public function test_admin_can_create_seo_landing_from_query(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        SearchQuery::create([
            'query' => 'Action',
            'normalized_query' => 'action',
            'results_count' => 1,
            'device_hash' => 'device-1',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($admin)->post(route('admin.seo-opportunities.create-landing', 'action'), [
            'category' => 'sports',
            'duration' => 'short',
        ]);

        $response->assertRedirect();
        $this->assertTrue(SeoLanding::query()->where('slug', 'sports-action-short')->exists());
    }
}
