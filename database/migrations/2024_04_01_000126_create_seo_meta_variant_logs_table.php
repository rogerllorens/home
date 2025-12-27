<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_meta_variant_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seo_meta_variant_id')->constrained('seo_meta_variants')->cascadeOnDelete();
            $table->string('page_type')->index();
            $table->unsignedBigInteger('page_id')->nullable()->index();
            $table->boolean('is_organic')->default(false)->index();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_meta_variant_logs');
    }
};
