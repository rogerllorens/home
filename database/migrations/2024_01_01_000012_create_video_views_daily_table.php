<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_views_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained('videos')->cascadeOnDelete();
            $table->date('day');
            $table->unsignedBigInteger('views')->default(0);
            $table->timestamps();

            $table->unique(['video_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_views_daily');
    }
};
