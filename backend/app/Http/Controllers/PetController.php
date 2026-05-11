<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class PetController extends Controller
{
    public function index()
    {
        $pets = DB::table('pets')->get();

        return response()
            ->json($pets)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET')
            ->header('Access-Control-Allow-Headers', '*');
    }
}