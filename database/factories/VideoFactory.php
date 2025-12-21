<?php

namespace Database\Factories;

use App\Enums\VideoStatus;
use App\Models\Source;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

class VideoFactory extends Factory
{
    protected $model = Video::class;

    public function definition(): array
    {
        return [
            'source_id' => Source::factory(),
            'external_id' => $this->faker->uuid,
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'seo_title' => $this->faker->sentence,
            'seo_description' => $this->faker->paragraph,
            'embed_url' => $this->faker->unique()->url,
            'embed_html' => '<iframe src="https://example.com"></iframe>',
            'thumbnail_url' => $this->faker->imageUrl(1280, 720, 'abstract'),
            'duration_seconds' => $this->faker->numberBetween(30, 720),
            'status' => VideoStatus::Ready,
            'category_slug' => 'featured',
            'raw_title' => $this->faker->sentence,
            'raw_description' => $this->faker->paragraph,
            'raw_tags' => ['sample', 'tag'],
            'seo_tags' => ['seo', 'tag'],
            'language' => 'es',
            'embed_ok' => true,
            'embed_last_ok_at' => now(),
            'duplicate_count' => 0,
            'source_url' => $this->faker->url,
        ];
    }
}
