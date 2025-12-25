<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class GenerateSitemapsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_sitemaps_command_creates_index_and_video_files(): void
    {
        $published = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Published Video',
            'seo_description' => 'Published description',
            'embed_ok' => true,
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Draft,
            'seo_title' => 'Draft Video',
            'seo_description' => 'Draft description',
            'embed_ok' => true,
        ]);

        Cache::shouldReceive('lock')->andReturn(new class {
            public function get(): bool
            {
                return true;
            }

            public function release(): void
            {
            }
        });

        Artisan::call('sitemaps:generate');

        $directory = public_path('sitemaps');
        $this->assertTrue(File::exists($directory.'/index.xml'));

        $files = File::files($directory);
        $videoFiles = array_filter($files, fn ($file) => str_contains($file->getFilename(), 'videos-'));
        $this->assertNotEmpty($videoFiles);

        $xml = File::get($videoFiles[array_key_first($videoFiles)]->getPathname());
        $this->assertStringContainsString(
            route('public.video', ['slug' => Str::slug($published->seo_title), 'id' => $published->id]),
            $xml
        );
    }
}
