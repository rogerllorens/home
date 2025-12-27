<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_page_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('page_type')->index();
            $table->unsignedBigInteger('page_id')->nullable()->index();
            $table->string('url');
            $table->timestamp('last_content_refresh_at')->nullable();
            $table->unsignedInteger('views_recent')->default(0);
            $table->unsignedInteger('views_previous')->default(0);
            $table->boolean('is_stale')->default(false)->index();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->unique(['page_type', 'page_id', 'url']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_page_metrics');
    }
};
