<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroomingPackage extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'services', 'price', 'duration', 'image'
    ];

    protected $casts = [
        'services' => 'array',
        'price' => 'float',
    ];
}
