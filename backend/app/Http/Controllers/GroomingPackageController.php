<?php

namespace App\Http\Controllers;

use App\Models\GroomingPackage;
use Illuminate\Http\Request;

class GroomingPackageController extends Controller
{
    public function index()
    {
        return response()->json(GroomingPackage::all());
    }

    public function show($id)
    {
        $package = GroomingPackage::findOrFail($id);
        return response()->json($package);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string|unique:grooming_packages,id',
            'name' => 'required|string',
            'services' => 'nullable|array',
            'price' => 'required|numeric',
            'duration' => 'required|string',
            'image' => 'nullable|string'
        ]);

        $package = GroomingPackage::create($validated);
        return response()->json($package, 201);
    }

    public function update(Request $request, $id)
    {
        $package = GroomingPackage::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'services' => 'nullable|array',
            'price' => 'sometimes|numeric',
            'duration' => 'sometimes|string',
            'image' => 'nullable|string'
        ]);

        $package->update($validated);
        return response()->json($package);
    }

    public function destroy($id)
    {
        $package = GroomingPackage::findOrFail($id);
        $package->delete();
        return response()->json(['message' => 'Grooming package deleted']);
    }
}
