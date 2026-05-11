<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // baju, aksesoris, makanan, snack, pasir, alat-makan, alat-minum, kandang, alat-tidur
            $table->text('description')->nullable();
            $table->integer('price')->default(0);
            $table->string('image')->nullable();
            $table->integer('stock')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_products');
    }
};
