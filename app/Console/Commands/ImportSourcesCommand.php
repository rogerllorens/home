<?php

namespace App\Console\Commands;

use App\Models\Source;
use App\Services\Import\SourceImporter;
use Illuminate\Console\Command;

class ImportSourcesCommand extends Command
{
    protected $signature = 'sources:import {sourceId?}';
    protected $description = 'Import videos from configured sources';

    public function handle(SourceImporter $importer): int
    {
        $sourceId = $this->argument('sourceId');
        $query = Source::query()->where('is_active', true);

        if ($sourceId) {
            $query->where('id', $sourceId);
        }

        $sources = $query->get();

        if ($sources->isEmpty()) {
            $this->info('No active sources found.');
            return self::SUCCESS;
        }

        foreach ($sources as $source) {
            $this->info("Importing source {$source->id} ({$source->name})...");
            $run = $importer->import($source);
            $this->info("Run {$run->id} status: {$run->status->value}");
        }

        return self::SUCCESS;
    }
}
