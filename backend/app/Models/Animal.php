<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Animal extends Model
{
    protected $table = 'animals';
public $timestamps = false;
    protected $fillable = [
        'name',
        'category_id',
        'breed_id',
        'gender',
        'age',
        'description',
        'health_history',
        'favorite_toy',
        'personality',
        'price',
        'stock',
        'image'
    ];
}