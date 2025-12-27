<?php

namespace Database\Factories;

use App\Enums\JourneyStatus;
use App\Models\Journey;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class JourneyFactory extends Factory
{
    protected $model = Journey::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'description' => $this->faker->paragraph,
            'status' => JourneyStatus::Draft,
        ];
    }
}
