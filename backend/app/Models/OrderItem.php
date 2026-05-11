<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $table = 'order_items';

    protected $fillable = [
        'order_id',
        'item_type',
        'item_id',
        'quantity',
        'price',
        'item_snapshot'
    ];

    protected $casts = [
        'item_snapshot' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }
}