<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entity_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->cascadeOnDelete();
            $table->foreignId('related_entity_id')->constrained('entities')->cascadeOnDelete();
            $table->string('relation_type')->default('related');
            $table->timestamps();

            $table->unique(['entity_id', 'related_entity_id', 'relation_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_relations');
    }
};
