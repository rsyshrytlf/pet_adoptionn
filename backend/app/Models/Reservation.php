<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'user_id', 'user_name', 'user_email', 'user_phone',
        'date', 'time', 'type', 'grooming_package', 'status',
        'admin_fee', 'payment_proof', 'attended', 'created_at_timestamp'
    ];

    protected $casts = [
        'grooming_package' => 'array',
        'attended' => 'boolean',
        'admin_fee' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
