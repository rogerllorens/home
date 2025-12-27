<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cta_clicks', function (Blueprint $table) {
            $table->foreignId('cta_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('origin_page')->nullable()->after('landing_type');
            $table->text('page_url')->nullable()->after('origin_page');
            $table->string('device_hash')->nullable()->after('page_url');
        });
    }

    public function down(): void
    {
        Schema::table('cta_clicks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cta_id');
            $table->dropColumn(['origin_page', 'page_url', 'device_hash']);
        });
    }
};
