<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->string('device_hash', 64)->index();
            $table->timestamp('viewed_at')->index();
            $table->index(['video_id', 'device_hash', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_views');
    }
};
