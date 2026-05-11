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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->string('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            
            $table->string('item_type'); // pet, product, grooming
            $table->string('item_id'); // ID asli dari pets/products
            $table->integer('quantity')->default(1);
            $table->decimal('price', 15, 2)->default(0);
            
            // Snapshot item (untuk berjaga-jaga jika produk aslinya dihapus)
            $table->json('item_snapshot')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
