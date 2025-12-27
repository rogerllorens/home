<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table): void {
            $table->boolean('is_manual_upload')->default(false)->after('is_featured');
            $table->boolean('has_takedown_contact')->default(false)->after('is_manual_upload');
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table): void {
            $table->dropColumn(['is_manual_upload', 'has_takedown_contact']);
        });
    }
};
