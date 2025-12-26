<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cta_clicks', function (Blueprint $table) {
            $table->string('cta_variant')->nullable()->after('placement');
        });
    }

    public function down(): void
    {
        Schema::table('cta_clicks', function (Blueprint $table) {
            $table->dropColumn('cta_variant');
        });
    }
};
