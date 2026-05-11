<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopProduct extends Model
{
    protected $table = 'shop_products';

    protected $fillable = [
        'name',
        'category',
        'description',
        'price',
        'image',
        'stock',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
    ];
}
