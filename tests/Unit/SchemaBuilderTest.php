<?php

namespace Tests\Unit;

use App\Models\Entity;
use App\Models\Video;
use App\Services\Schema\SchemaBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchemaBuilderTest extends TestCase
{
    use RefreshDatabase;

    public function test_builds_breadcrumbs_schema(): void
    {
        $builder = new SchemaBuilder();
        $schema = $builder->breadcrumbs([
            ['name' => 'Home', 'item' => 'https://example.com'],
            ['name' => 'Category', 'item' => 'https://example.com/cat'],
        ]);

        $this->assertSame('BreadcrumbList', $schema['@type']);
        $this->assertCount(2, $schema['itemListElement']);
    }

    public function test_builds_item_list_schema(): void
    {
        $video = Video::factory()->create([
            'seo_title' => 'Video title',
        ]);

        $builder = new SchemaBuilder();
        $schema = $builder->itemList(collect([$video]));

        $this->assertSame('ItemList', $schema['@type']);
        $this->assertSame('Video title', $schema['itemListElement'][0]['name']);
    }

    public function test_builds_video_schema(): void
    {
        $video = Video::factory()->create([
            'seo_title' => 'Video title',
        ]);

        $builder = new SchemaBuilder();
        $schema = $builder->video($video);

        $this->assertSame('VideoObject', $schema['@type']);
        $this->assertSame('Video title', $schema['name']);
    }

    public function test_builds_faq_schema(): void
    {
        $builder = new SchemaBuilder();
        $schema = $builder->faqPage([
            ['question' => 'Q1', 'answer' => 'A1'],
        ]);

        $this->assertSame('FAQPage', $schema['@type']);
        $this->assertSame('Q1', $schema['mainEntity'][0]['name']);
    }

    public function test_builds_entity_schema(): void
    {
        $entity = Entity::create([
            'name' => 'Fitness',
            'slug' => 'fitness',
            'type' => 'concept',
            'description' => 'Desc',
        ]);

        $builder = new SchemaBuilder();
        $schema = $builder->entity($entity);

        $this->assertSame('DefinedTerm', $schema['@type']);
        $this->assertSame('Fitness', $schema['name']);
    }
}
