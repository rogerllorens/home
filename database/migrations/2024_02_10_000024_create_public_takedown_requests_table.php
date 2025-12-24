<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_takedown_requests', function (Blueprint $table) {
            $table->id();
            $table->string('url');
            $table->string('email');
            $table->string('requester_name')->nullable();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->string('referrer')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_takedown_requests');
    }
};
