<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cta_impressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cta_id')->constrained()->cascadeOnDelete();
            $table->foreignId('video_id')->nullable()->constrained()->nullOnDelete();
            $table->string('origin_page')->nullable();
            $table->text('page_url')->nullable();
            $table->text('referrer')->nullable();
            $table->string('device_hash')->nullable();
            $table->timestamps();

            $table->index(['cta_id', 'created_at']);
            $table->index(['origin_page', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cta_impressions');
    }
};
