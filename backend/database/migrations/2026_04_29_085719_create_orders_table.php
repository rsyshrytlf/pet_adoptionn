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
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id')->primary(); // BKG..., MPH...
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('user_data')->nullable(); // Snapshot data user (name, address, dll)
            $table->string('order_type'); // adoption, product, grooming
            $table->string('status')->default('pending'); // unpaid, pending, confirmed, processing, shipped, ready, completed, cancelled
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('delivery_method')->nullable(); // pickup, delivery
            $table->decimal('delivery_fee', 15, 2)->default(0);
            
            // Proof URLs
            $table->string('payment_proof')->nullable();
            $table->string('pickup_proof')->nullable();
            $table->string('delivery_proof')->nullable();
            
            // Other data
            $table->string('unique_code')->nullable();
            $table->bigInteger('expires_at')->nullable(); // timestamp in ms
            
            // Review
            $table->json('review')->nullable(); // { rating, comment, approved, reply, images }

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
