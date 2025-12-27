<?php

use App\Enums\VideoModerationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('moderation_status')
                ->default(VideoModerationStatus::PendingReview->value)
                ->after('status');
            $table->timestamp('moderation_reviewed_at')->nullable()->after('moderation_status');
            $table->unsignedBigInteger('moderation_reviewed_by')->nullable()->after('moderation_reviewed_at');
            $table->boolean('is_featured')->default(false)->after('moderation_reviewed_by');
        });

        DB::table('videos')->update([
            'moderation_status' => VideoModerationStatus::Approved->value,
        ]);
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'moderation_status',
                'moderation_reviewed_at',
                'moderation_reviewed_by',
                'is_featured',
            ]);
        });
    }
};
