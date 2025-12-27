<?php

namespace Database\Factories;

use App\Enums\SourceType;
use App\Models\Source;
use Illuminate\Database\Eloquent\Factories\Factory;

class SourceFactory extends Factory
{
    protected $model = Source::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company,
            'type' => SourceType::Manual,
            'feed_url' => $this->faker->url,
            'auth_header' => 'Bearer '.$this->faker->sha1,
            'settings' => [
                'notes' => $this->faker->sentence,
            ],
            'import_schedule_cron' => '0 0 * * *',
            'is_active' => true,
            'is_verified' => false,
        ];
    }
}
