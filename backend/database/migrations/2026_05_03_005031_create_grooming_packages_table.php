<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grooming_packages', function (Blueprint $table) {
            $table->string('id')->primary(); // BKG..., MPH...
            $table->string('name');
            $table->json('services')->nullable(); // array of services
            $table->decimal('price', 15, 2)->default(0);
            $table->string('duration');
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grooming_packages');
    }
};
