<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Entity;
use App\Models\EntityRelation;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntityPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_entity_page_renders_related_content(): void
    {
        $entity = Entity::create([
            'name' => 'Fitness',
            'slug' => 'fitness',
            'type' => 'concept',
            'description' => 'Fitness content',
        ]);

        $related = Entity::create([
            'name' => 'Training',
            'slug' => 'training',
            'type' => 'concept',
            'description' => 'Training content',
        ]);

        EntityRelation::create([
            'entity_id' => $entity->id,
            'related_entity_id' => $related->id,
            'relation_type' => 'related',
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        $entity->videos()->attach($video->id);

        $response = $this->get(route('public.entity', 'fitness'));

        $response->assertOk();
        $response->assertSee('Fitness');
        $response->assertSee('Training');
    }
}
