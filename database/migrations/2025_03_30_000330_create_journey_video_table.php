<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journey_video', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('journey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['journey_id', 'video_id']);
            $table->index(['journey_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journey_video');
    }
};
