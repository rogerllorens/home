<?php

namespace App\Services\Import;

use App\DTO\VideoCandidate;
use App\Models\Source;

interface SourceAdapterInterface
{
    /**
     * @return array<VideoCandidate>
     */
    public function fetchCandidates(Source $source): array;
}
