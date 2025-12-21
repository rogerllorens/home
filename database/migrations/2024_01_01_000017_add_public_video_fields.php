<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('seo_title')->nullable()->after('title');
            $table->text('seo_description')->nullable()->after('description');
            $table->string('thumbnail_url')->nullable()->after('embed_html');
            $table->unsignedInteger('duration_seconds')->nullable()->after('thumbnail_url');
            $table->timestamp('embed_last_ok_at')->nullable()->after('embed_checked_at');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'seo_title',
                'seo_description',
                'thumbnail_url',
                'duration_seconds',
                'embed_last_ok_at',
            ]);
        });
    }
};
