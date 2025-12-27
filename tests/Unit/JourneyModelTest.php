<?php

namespace Tests\Unit;

use App\Enums\JourneyStatus;
use App\Models\Journey;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JourneyModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_scope_returns_only_published_journeys(): void
    {
        Journey::factory()->create([
            'status' => JourneyStatus::Draft,
        ]);

        $published = Journey::factory()->create([
            'status' => JourneyStatus::Published,
        ]);

        $this->assertTrue(Journey::published()->whereKey($published->id)->exists());
        $this->assertCount(1, Journey::published()->get());
    }

    public function test_journey_videos_are_ordered_by_position(): void
    {
        $journey = Journey::factory()->create([
            'status' => JourneyStatus::Published,
        ]);

        $first = Video::factory()->create();
        $second = Video::factory()->create();

        $journey->videos()->sync([
            $second->id => ['position' => 2],
            $first->id => ['position' => 1],
        ]);

        $ordered = $journey->videos()->get();

        $this->assertSame([$first->id, $second->id], $ordered->pluck('id')->all());
    }
}
