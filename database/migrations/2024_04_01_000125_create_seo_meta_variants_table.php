<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_meta_variants', function (Blueprint $table) {
            $table->id();
            $table->string('page_type')->index();
            $table->unsignedBigInteger('page_id')->nullable()->index();
            $table->string('title');
            $table->text('description');
            $table->unsignedInteger('weight')->default(1);
            $table->boolean('is_winner')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_meta_variants');
    }
};
