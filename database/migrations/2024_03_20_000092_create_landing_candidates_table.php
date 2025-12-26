<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_candidates', function (Blueprint $table) {
            $table->id();
            $table->string('query');
            $table->string('slug')->unique();
            $table->unsignedInteger('hits_last_30d')->default(0);
            $table->unsignedInteger('videos_count')->default(0);
            $table->string('status')->default('candidate')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_candidates');
    }
};
