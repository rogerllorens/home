<?php

namespace App\Services\Import;

use App\Models\Source;

class ManualAdapter implements SourceAdapterInterface
{
    public function fetchCandidates(Source $source): array
    {
        return [];
    }
}
