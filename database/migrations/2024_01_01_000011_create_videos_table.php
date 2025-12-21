<?php

use App\Enums\VideoStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_id')->constrained('sources')->cascadeOnDelete();
            $table->string('external_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('embed_url')->unique();
            $table->text('embed_html')->nullable();
            $table->string('status')->default(VideoStatus::Draft->value);
            $table->text('raw_tags')->nullable();
            $table->text('seo_tags')->nullable();
            $table->string('language', 5)->default('es');
            $table->unsignedSmallInteger('embed_failures')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('ai_checked_at')->nullable();
            $table->unsignedSmallInteger('ai_quality')->nullable();
            $table->timestamp('embed_checked_at')->nullable();
            $table->timestamp('embed_next_check_at')->nullable();
            $table->timestamps();

            $table->unique(['source_id', 'external_id']);
            $table->index('status');
        });

        DB::statement("ALTER TABLE videos ALTER COLUMN raw_tags TYPE text[] USING CASE WHEN raw_tags IS NULL OR raw_tags = '' THEN ARRAY[]::text[] ELSE string_to_array(raw_tags, ',') END");
        DB::statement("ALTER TABLE videos ALTER COLUMN raw_tags SET DEFAULT ARRAY[]::text[]");
        DB::statement("ALTER TABLE videos ALTER COLUMN seo_tags TYPE text[] USING CASE WHEN seo_tags IS NULL OR seo_tags = '' THEN ARRAY[]::text[] ELSE string_to_array(seo_tags, ',') END");
        DB::statement("ALTER TABLE videos ALTER COLUMN seo_tags SET DEFAULT ARRAY[]::text[]");
    }

    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
