<?php

use App\Enums\PublicTakedownStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('public_takedown_requests', function (Blueprint $table) {
            $table->string('status')->default(PublicTakedownStatus::Received->value)->after('notes');
            $table->timestamp('reviewed_at')->nullable()->after('status');
            $table->timestamp('resolved_at')->nullable()->after('reviewed_at');
            $table->unsignedBigInteger('handled_by')->nullable()->after('resolved_at');
        });
    }

    public function down(): void
    {
        Schema::table('public_takedown_requests', function (Blueprint $table) {
            $table->dropColumn(['status', 'reviewed_at', 'resolved_at', 'handled_by']);
        });
    }
};
