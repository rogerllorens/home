<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_candidates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('source')->default('search');
            $table->string('normalized_name')->index();
            $table->unsignedInteger('videos_count')->default(0);
            $table->unsignedInteger('hits_last_30d')->default(0);
            $table->string('status')->default('candidate')->index();
            $table->boolean('is_subcategory')->default(false);
            $table->foreignId('parent_category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_candidates');
    }
};
