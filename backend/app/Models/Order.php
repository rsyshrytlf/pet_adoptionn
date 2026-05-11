<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';

    // Primary key is string
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'user_data',
        'order_type',
        'status',
        'total_amount',
        'delivery_method',
        'delivery_fee',
        'payment_proof',
        'pickup_proof',
        'delivery_proof',
        'unique_code',
        'expires_at',
        'review'
    ];

    protected $casts = [
        'user_data' => 'array',
        'review' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'id');
    }
}