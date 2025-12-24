<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('quarantine_reason')->nullable()->after('status');
            $table->string('import_error_reason')->nullable()->after('raw_description');

            $table->index(['status', 'published_at']);
            $table->index(['category_slug', 'published_at']);
            $table->index('duration_seconds');
        });

        DB::statement('CREATE INDEX IF NOT EXISTS videos_raw_tags_gin ON videos USING GIN (raw_tags)');
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropIndex(['status', 'published_at']);
            $table->dropIndex(['category_slug', 'published_at']);
            $table->dropIndex(['duration_seconds']);
            $table->dropColumn(['quarantine_reason', 'import_error_reason']);
        });

        DB::statement('DROP INDEX IF EXISTS videos_raw_tags_gin');
    }
};
