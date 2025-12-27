<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_view_histories', function (Blueprint $table) {
            $table->id();
            $table->string('device_hash', 64)->index();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_watched_at');
            $table->unsignedInteger('last_position_seconds')->nullable();
            $table->timestamps();

            $table->unique(['device_hash', 'video_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_view_histories');
    }
};
