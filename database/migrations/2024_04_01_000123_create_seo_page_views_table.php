<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_page_views', function (Blueprint $table) {
            $table->id();
            $table->string('page_type')->index();
            $table->unsignedBigInteger('page_id')->nullable()->index();
            $table->string('url');
            $table->string('referrer')->nullable();
            $table->timestamp('viewed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_page_views');
    }
};
