<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topic_clusters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('h1')->nullable();
            $table->string('h2')->nullable();
            $table->text('intro')->nullable();
            $table->json('category_slugs')->nullable();
            $table->json('tag_slugs')->nullable();
            $table->boolean('is_public')->default(true)->index();
            $table->string('language', 5)->default('es');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_clusters');
    }
};
