<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('raw_title')->nullable()->after('title');
            $table->text('raw_description')->nullable()->after('description');
            $table->string('source_url')->nullable()->after('embed_url');
            $table->unsignedInteger('duplicate_count')->default(0)->after('embed_ok');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn(['raw_title', 'raw_description', 'source_url', 'duplicate_count']);
        });
    }
};
