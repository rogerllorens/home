<?php

namespace Tests\Feature;

use Tests\TestCase;

class VideoNotFoundTest extends TestCase
{
    public function test_video_not_found_returns_404(): void
    {
        $response = $this->get('/v/missing-99999');

        $response->assertNotFound();
    }
}
