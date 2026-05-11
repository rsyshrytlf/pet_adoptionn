<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PetController;

// route default (biarin aja)
Route::get('/', function () {
    return view('welcome');
});

// route ambil data pet
Route::get('/pets', [PetController::class, 'index']);