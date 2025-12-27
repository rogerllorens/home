<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_health_issues', function (Blueprint $table) {
            $table->id();
            $table->string('page_type')->index();
            $table->string('url');
            $table->string('issue_type');
            $table->string('severity')->default('medium');
            $table->string('status')->default('new')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_health_issues');
    }
};
