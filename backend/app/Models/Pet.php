<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pet extends Model
{
    protected $table = 'pets';

    protected $fillable = [
        'name',
        'type',
        'breed',
        'gender',
        'age',
        'description',
        'personality',
        'favorite_food',
        'favorite_toy',
        'health',
        'rescue_story',
        'suitable_for',
        'images',
        'status',
        'price',
    ];

    protected $casts = [
        'images' => 'array',
        'price'  => 'integer',
    ];
}
