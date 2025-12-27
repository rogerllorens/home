<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_landings', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('type')->index();
            $table->json('params');
            $table->string('title_template');
            $table->text('description_template');
            $table->json('faq_template')->nullable();
            $table->boolean('is_public')->default(true)->index();
            $table->unsignedInteger('videos_count')->default(0);
            $table->string('language', 5)->default('es');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_landings');
    }
};
