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
        Schema::create('reservations', function (Blueprint $table) {
            $table->string('id')->primary(); // REV12345
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('user_name');
            $table->string('user_email');
            $table->string('user_phone');
            $table->date('date');
            $table->string('time');
            $table->enum('type', ['shelter', 'grooming']);
            $table->json('grooming_package')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->decimal('admin_fee', 10, 2)->default(0);
            $table->string('payment_proof')->nullable();
            $table->boolean('attended')->default(false);
            $table->bigInteger('created_at_timestamp')->nullable(); // frontend uses this
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
