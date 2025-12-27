<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topic_clusters', function (Blueprint $table) {
            $table->boolean('is_discover_candidate')->default(false)->index();
            $table->string('hero_image_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('topic_clusters', function (Blueprint $table) {
            $table->dropColumn(['is_discover_candidate', 'hero_image_url']);
        });
    }
};
