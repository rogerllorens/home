<?php

namespace App\DTO;

class VideoCandidate
{
    public function __construct(
        public string $externalId,
        public string $embedUrl,
        public string $thumbnailUrl,
        public string $rawTitle,
        public ?string $rawDescription = null,
        public ?array $rawTags = null,
        public ?int $durationSeconds = null,
        public ?string $sourceUrl = null,
    ) {
    }
}
