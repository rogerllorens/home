<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pageviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('search_landing_id')->constrained('search_landings')->cascadeOnDelete();
            $table->timestamp('viewed_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_pageviews');
    }
};
