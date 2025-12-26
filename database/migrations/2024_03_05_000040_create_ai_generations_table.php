<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('input_hash', 64);
            $table->text('output_text');
            $table->timestamps();

            $table->unique(['type', 'input_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
    }
};
