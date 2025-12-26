<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_landings', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('query');
            $table->string('title');
            $table->string('description');
            $table->string('language', 8)->default('en');
            $table->boolean('is_public')->default(false)->index();
            $table->foreignId('collection_id')->nullable()->constrained('collections')->nullOnDelete();
            $table->unsignedInteger('videos_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_landings');
    }
};
