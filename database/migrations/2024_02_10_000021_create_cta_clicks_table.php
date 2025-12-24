<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cta_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->string('cta_key');
            $table->string('placement')->nullable();
            $table->string('category_slug')->nullable();
            $table->string('referrer')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->uuid('click_id')->unique();
            $table->text('destination_url')->nullable();
            $table->timestamps();

            $table->index(['cta_key', 'created_at']);
            $table->index(['category_slug', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cta_clicks');
    }
};
