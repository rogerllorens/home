<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('search_landings', function (Blueprint $table) {
            $table->unsignedInteger('pageviews_last_30d')->default(0);
            $table->decimal('ctr_affiliate_last_30d', 6, 4)->nullable();
            $table->decimal('avg_position_guess', 6, 2)->nullable();
            $table->string('language', 8)->default('en')->change();
        });
    }

    public function down(): void
    {
        Schema::table('search_landings', function (Blueprint $table) {
            $table->dropColumn([
                'pageviews_last_30d',
                'ctr_affiliate_last_30d',
                'avg_position_guess',
            ]);
        });
    }
};
