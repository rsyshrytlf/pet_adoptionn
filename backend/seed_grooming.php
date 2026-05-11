<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\GroomingPackage;

$packages = [
    [
        'id' => 'PKG-A',
        'name' => 'Paket A - Basic Care',
        'price' => 250000,
        'duration' => '1.5 jam',
        'image' => 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80',
        'services' => ['Mandi', 'Sisir Bulu', 'Potong Kuku'],
    ],
    [
        'id' => 'PKG-B',
        'name' => 'Paket B - Standard Grooming',
        'price' => 350000,
        'duration' => '2 jam',
        'image' => 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
        'services' => ['Mandi', 'Sisir Bulu', 'Potong Kuku', 'Pembersihan Telinga', 'Sikat Gigi'],
    ],
    [
        'id' => 'PKG-C',
        'name' => 'Paket C - Premium Spa',
        'price' => 500000,
        'duration' => '3 jam',
        'image' => 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
        'services' => ['Mandi', 'Sisir Bulu', 'Potong Kuku', 'Pembersihan Telinga', 'Sikat Gigi', 'Hair Cut Styling', 'Aromatherapy'],
    ],
    [
        'id' => 'PKG-D',
        'name' => 'Paket D - Luxury Treatment',
        'price' => 750000,
        'duration' => '4 jam',
        'image' => 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=400&q=80',
        'services' => ['Mandi', 'Sisir Bulu', 'Potong Kuku', 'Pembersihan Telinga', 'Sikat Gigi', 'Hair Cut Styling', 'Aromatherapy', 'Massage', 'Pedicure', 'Parfum'],
    ],
];

foreach ($packages as $pkg) {
    GroomingPackage::updateOrCreate(['id' => $pkg['id']], $pkg);
}

echo "Grooming packages seeded successfully!\n";
