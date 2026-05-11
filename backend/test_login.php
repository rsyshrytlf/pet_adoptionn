<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$admin = User::where('email', 'admin@meowmyhome.com')->first();
if (!$admin) {
    echo "Admin not found\n";
    exit;
}

$p = 'admin123';
if (Hash::check($p, $admin->password)) {
    echo "Hash check PASSED for 'admin123'.\n";
} else {
    echo "Hash check FAILED for 'admin123'. Hash in DB is: " . $admin->password . "\n";
}
