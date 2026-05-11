<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // kucing, anjing
            $table->string('breed');
            $table->string('gender'); // jantan, betina
            $table->string('age'); // e.g. "2 bulan", "1 tahun"
            $table->text('description')->nullable();
            $table->string('personality')->nullable();
            $table->string('favorite_food')->nullable();
            $table->string('favorite_toy')->nullable();
            $table->string('health')->nullable();
            $table->text('rescue_story')->nullable();
            $table->string('suitable_for')->nullable();
            $table->json('images')->nullable(); // array of image URLs
            $table->string('status')->default('available'); // available, booked, adopted
            $table->integer('price')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
