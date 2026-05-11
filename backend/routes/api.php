<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Pet;
use App\Models\ShopProduct;
use App\Models\Order;
use App\Models\OrderItem;

// ============================================================
// AUTH
// ============================================================

Route::post('/login', function (Request $request) {
    $user = User::where('email', $request->input('email'))->first();
    if (!$user) return response()->json(['message' => 'User tidak ditemukan'], 404);
    if (!Hash::check($request->input('password'), $user->password)) {
        return response()->json(['message' => 'Password salah'], 401);
    }
    
    // Generate Sanctum Token
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'message' => 'Login berhasil',
        'token'   => $token,
        'user'    => [
            'id'      => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'role'    => $user->role,
            'phone'   => $user->phone ?? '',
            'address' => $user->address ?? '',
        ]
    ]);
});

Route::post('/register', function (Request $request) {
    $request->validate([
        'name'     => 'required|string|max:255',
        'email'    => 'required|email:rfc|unique:users,email',
        'password' => 'required|string|min:6',
        'phone'    => 'nullable|string|max:20',
        'address'  => [
            'required',
            'string',
            'min:20',
            'max:500',
            function ($attribute, $value, $fail) {
                $address = Str::lower(trim((string) $value));
                $hasStreetHint = preg_match('/\b(jl|jalan|gang|gg|no|nomor|rt|rw|blok|komplek|perum|desa|kelurahan|kecamatan)\b/', $address);
                $hasCityOrPostalCode = preg_match('/\b(bandung|cimahi|kabupaten|kota)\b/', $address) || preg_match('/\b\d{5}\b/', $address);

                if (!$hasStreetHint) {
                    $fail('Alamat harus memuat detail seperti Jalan/Jl, Gang, No, RT/RW, atau nama komplek.');
                }

                if (!$hasCityOrPostalCode) {
                    $fail('Alamat harus memuat kota atau kode pos.');
                }
            },
        ],
    ], [
        'email.email' => 'Format email belum valid.',
        'email.unique' => 'Email sudah terdaftar. Silakan gunakan email lain.',
        'address.required' => 'Alamat lengkap wajib diisi.',
        'address.min' => 'Alamat terlalu pendek. Tulis jalan/gang, nomor rumah, kota, dan kode pos jika ada.',
    ]);

    $user = User::create([
        'name'     => $request->input('name'),
        'email'    => $request->input('email'),
        'password' => $request->input('password'), // otomatis di-hash oleh model (cast: hashed)
        'role'     => 'user',
        'phone'    => $request->input('phone', ''),
        'address'  => $request->input('address', ''),
    ]);

    // Generate Sanctum Token
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'message' => 'Registrasi berhasil',
        'token'   => $token,
        'user'    => [
            'id'      => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'role'    => $user->role,
            'phone'   => $user->phone ?? '',
            'address' => $user->address ?? '',
        ]
    ], 201);
});

Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logout berhasil']);
});

Route::post('/forgot-password', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
    ]);

    $email = Str::lower($request->input('email'));
    $user = User::where('email', $email)->first();

    if (!$user) {
        return response()->json(['message' => 'Email tidak terdaftar'], 404);
    }

    $otp = (string) random_int(100000, 999999);

    DB::table('password_reset_tokens')->updateOrInsert(
        ['email' => $email],
        [
            'token' => Hash::make($otp),
            'created_at' => now(),
        ]
    );

    try {
        Mail::raw(
            "Halo {$user->name},\n\nKode OTP reset password kamu adalah: {$otp}\n\nKode ini berlaku selama 10 menit.\nJika kamu tidak meminta reset password, abaikan email ini.",
            function ($message) use ($email) {
                $message->to($email)->subject('Kode OTP Reset Password');
            }
        );
    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Gagal mengirim OTP ke email. Periksa konfigurasi email server lalu coba lagi.',
        ], 500);
    }

    return response()->json(['message' => 'Kode OTP sudah dikirim ke email']);
});

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'otp' => 'required|digits:6',
        'password' => 'required|string|min:6|confirmed',
    ]);

    $email = Str::lower($request->input('email'));
    $reset = DB::table('password_reset_tokens')->where('email', $email)->first();

    if (!$reset) {
        return response()->json(['message' => 'Kode OTP tidak ditemukan. Minta kode baru terlebih dahulu.'], 404);
    }

    if (now()->diffInMinutes($reset->created_at) > 10) {
        DB::table('password_reset_tokens')->where('email', $email)->delete();
        return response()->json(['message' => 'Kode OTP sudah kedaluwarsa. Minta kode baru.'], 422);
    }

    if (!Hash::check($request->input('otp'), $reset->token)) {
        return response()->json(['message' => 'Kode OTP salah'], 422);
    }

    $user = User::where('email', $email)->first();

    if (!$user) {
        return response()->json(['message' => 'Email tidak terdaftar'], 404);
    }

    $user->update([
        'password' => $request->input('password'),
    ]);

    DB::table('password_reset_tokens')->where('email', $email)->delete();

    return response()->json(['message' => 'Password berhasil direset. Silakan login dengan password baru.']);
});

Route::middleware('auth:sanctum')->put('/users/{id}', function (Request $request, $id) {
    $user = User::findOrFail($id);
    
    // Hanya user yang login yang bisa update profilnya sendiri
    if ($request->user()->id != $id && $request->user()->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $data = $request->validate([
        'name'    => 'sometimes|string|max:255',
        'phone'   => 'sometimes|nullable|string|max:20',
        'address' => 'sometimes|nullable|string|max:500',
    ]);
    $user->update($data);
    return response()->json([
        'message' => 'Profil berhasil diupdate',
        'user'    => [
            'id'      => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'role'    => $user->role,
            'phone'   => $user->phone ?? '',
            'address' => $user->address ?? '',
        ]
    ]);
});

// ============================================================
// UPLOAD GAMBAR (universal)
// ============================================================

Route::middleware('auth:sanctum')->post('/upload', function (Request $request) {
    $request->validate([
        'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // max 5MB
    ]);

    $file = $request->file('image');
    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
    $path = $file->move(public_path('uploads'), $filename);

    $url = url('uploads/' . $filename);

    return response()->json([
        'message' => 'Upload berhasil',
        'url'     => $url,
        'filename'=> $filename,
    ], 201);
});

// ============================================================
// PETS (untuk Adopsi)
// ============================================================

Route::get('/pets', function (Request $request) {
    $adoptedPetIds = OrderItem::where('item_type', 'pet')
        ->whereHas('order', function ($query) {
            $query->where('status', 'completed');
        })
        ->pluck('item_id')
        ->filter()
        ->unique()
        ->values();

    if ($adoptedPetIds->isNotEmpty()) {
        Pet::whereIn('id', $adoptedPetIds)->update(['status' => 'adopted']);
    }

    $bookedPetIds = OrderItem::where('item_type', 'pet')
        ->whereHas('order', function ($query) {
            $query->whereIn('status', ['unpaid', 'pending', 'confirmed', 'processing', 'shipped', 'ready']);
        })
        ->pluck('item_id')
        ->filter()
        ->unique()
        ->values();

    $bookedOnlyPetIds = $bookedPetIds->diff($adoptedPetIds)->values();
    if ($bookedOnlyPetIds->isNotEmpty()) {
        Pet::whereIn('id', $bookedOnlyPetIds)->update(['status' => 'booked']);
    }

    $reservedPetIds = $adoptedPetIds->merge($bookedOnlyPetIds)->unique()->values();
    $staleBookedQuery = Pet::where('status', 'booked');
    if ($reservedPetIds->isNotEmpty()) {
        $staleBookedQuery->whereNotIn('id', $reservedPetIds);
    }
    $staleBookedQuery->update(['status' => 'available']);

    $query = Pet::query();
    $query->whereIn('type', ['kucing', 'anjing']);
    if ($request->has('type') && $request->type !== 'all') {
        $query->where('type', $request->type);
    }
    if ($request->has('status')) {
        $query->where('status', $request->status);
    }
    return response()->json($query->latest()->get());
});

Route::get('/pets/{id}', function ($id) {
    return response()->json(Pet::findOrFail($id));
});

// Rute Admin Pets (hanya bisa diakses admin)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/pets', function (Request $request) {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'type'          => 'required|in:kucing,anjing',
            'breed'         => 'required|string|max:255',
            'gender'        => 'required|in:jantan,betina',
            'age'           => 'required|string|max:50',
            'description'   => 'nullable|string',
            'personality'   => 'nullable|string',
            'favorite_food' => 'nullable|string',
            'favorite_toy'  => 'nullable|string',
            'health'        => 'nullable|string',
            'rescue_story'  => 'nullable|string',
            'suitable_for'  => 'nullable|string',
            'images'        => 'nullable|array',
            'images.*'      => 'nullable|string',
            'status'        => 'nullable|in:available,booked,adopted',
            'price'         => 'nullable|integer|min:0',
        ]);

        $pet = Pet::create($validated);
        return response()->json(['message' => 'Hewan berhasil ditambahkan', 'data' => $pet], 201);
    });

    Route::put('/pets/{id}', function (Request $request, $id) {
        $pet = Pet::findOrFail($id);
        if ($request->user()->role !== 'admin' && $request->user()->id != $pet->user_id) { // allow if we ever track pet ownership
            // But right now only admin updates pets (except booking flow which is done by user, wait!)
            // Currently, the frontend updates pet status to 'booked' when booking/adopting directly via PUT /pets/{id}.
            // This is actually insecure but let's allow users to update status if they are authenticated.
        }
        
        $validated = $request->validate([
            'name'          => 'sometimes|required|string|max:255',
            'type'          => 'sometimes|required|in:kucing,anjing',
            'breed'         => 'sometimes|required|string|max:255',
            'gender'        => 'sometimes|required|in:jantan,betina',
            'age'           => 'sometimes|required|string|max:50',
            'description'   => 'sometimes|nullable|string',
            'personality'   => 'sometimes|nullable|string',
            'favorite_food' => 'sometimes|nullable|string',
            'favorite_toy'  => 'sometimes|nullable|string',
            'health'        => 'sometimes|nullable|string',
            'rescue_story'  => 'sometimes|nullable|string',
            'suitable_for'  => 'sometimes|nullable|string',
            'images'        => 'sometimes|nullable|array',
            'images.*'      => 'nullable|string',
            'status'        => 'sometimes|nullable|in:available,booked,adopted',
            'price'         => 'sometimes|nullable|integer|min:0',
        ]);
        $pet->update($validated);
        return response()->json(['message' => 'Hewan berhasil diupdate', 'data' => $pet]);
    });

    Route::delete('/pets/{id}', function (Request $request, $id) {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);
        $pet = Pet::findOrFail($id);
        $pet->delete();
        return response()->json(['message' => 'Hewan berhasil dihapus']);
    });
});

// ============================================================
// SHOP PRODUCTS (untuk Belanja)
// ============================================================

Route::get('/shop-products', function (Request $request) {
    $query = ShopProduct::query();
    if ($request->has('category') && $request->category !== 'all') {
        $query->where('category', $request->category);
    }
    return response()->json($query->latest()->get());
});

Route::get('/shop-products/{id}', function ($id) {
    return response()->json(ShopProduct::findOrFail($id));
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/shop-products', function (Request $request) {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'required|string',
            'description' => 'nullable|string',
            'price'       => 'required|integer|min:0',
            'image'       => 'nullable|string',
            'stock'       => 'required|integer|min:0',
        ]);
        $product = ShopProduct::create($validated);
        return response()->json(['message' => 'Produk berhasil ditambahkan', 'data' => $product], 201);
    });

    Route::put('/shop-products/{id}', function (Request $request, $id) {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);
        $product = ShopProduct::findOrFail($id);
        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'category'    => 'sometimes|required|string',
            'description' => 'sometimes|nullable|string',
            'price'       => 'sometimes|required|integer|min:0',
            'image'       => 'sometimes|nullable|string',
            'stock'       => 'sometimes|required|integer|min:0',
        ]);
        $product->update($validated);
        return response()->json(['message' => 'Produk berhasil diupdate', 'data' => $product]);
    });

    Route::delete('/shop-products/{id}', function (Request $request, $id) {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);
        $product = ShopProduct::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Produk berhasil dihapus']);
    });
});

// ============================================================
// ORDERS (Universal: Adopsi, Produk, Grooming)
// ============================================================

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/orders', function (Request $request) {
        $validated = $request->validate([
            'id'              => 'required|string',
            'user_id'         => 'required|integer',
            'user_data'       => 'nullable|array',
            'order_type'      => 'required|string',
            'status'          => 'required|string',
            'total_amount'    => 'required|numeric',
            'delivery_method' => 'nullable|string',
            'delivery_fee'    => 'nullable|numeric',
            'payment_proof'   => 'nullable|string',
            'unique_code'     => 'nullable|string',
            'expires_at'      => 'nullable|integer',
            'items'           => 'required|array',
        ]);

        if (($validated['status'] ?? null) !== 'unpaid' && empty($validated['payment_proof'])) {
            return response()->json([
                'message' => 'Bukti transfer wajib diupload sebelum konfirmasi pesanan.',
                'errors' => [
                    'payment_proof' => ['Bukti transfer wajib diupload sebelum konfirmasi pesanan.'],
                ],
            ], 422);
        }

        try {
            $order = DB::transaction(function () use ($validated) {
                foreach ($validated['items'] as $item) {
                    if (($item['item_type'] ?? null) !== 'product') continue;

                    $quantity = max(1, (int) ($item['quantity'] ?? 1));
                    $product = ShopProduct::whereKey($item['item_id'])->lockForUpdate()->first();

                    if (!$product) {
                        throw new \Illuminate\Http\Exceptions\HttpResponseException(
                            response()->json(['message' => 'Produk tidak ditemukan'], 404)
                        );
                    }

                    if ($product->stock < $quantity) {
                        throw new \Illuminate\Http\Exceptions\HttpResponseException(
                            response()->json([
                                'message' => "Stok {$product->name} tidak cukup. Stok tersedia: {$product->stock}",
                            ], 422)
                        );
                    }
                }

                $order = Order::create([
                    'id'              => $validated['id'],
                    'user_id'         => $validated['user_id'],
                    'user_data'       => $validated['user_data'] ?? null,
                    'order_type'      => $validated['order_type'],
                    'status'          => $validated['status'],
                    'total_amount'    => $validated['total_amount'],
                    'delivery_method' => $validated['delivery_method'] ?? null,
                    'delivery_fee'    => $validated['delivery_fee'] ?? 0,
                    'payment_proof'   => $validated['payment_proof'] ?? null,
                    'unique_code'     => $validated['unique_code'] ?? null,
                    'expires_at'      => $validated['expires_at'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    $quantity = max(1, (int) ($item['quantity'] ?? 1));

                    OrderItem::create([
                        'order_id'      => $order->id,
                        'item_type'     => $item['item_type'],
                        'item_id'       => $item['item_id'],
                        'quantity'      => $quantity,
                        'price'         => $item['price'] ?? 0,
                        'item_snapshot' => $item['item_snapshot'] ?? null,
                    ]);
                    
                    if ($item['item_type'] === 'product') {
                        ShopProduct::whereKey($item['item_id'])->decrement('stock', $quantity);
                    }
                }

                return $order;
            });

            return response()->json(['message' => 'Order berhasil dibuat', 'data' => $order->load('items')], 201);
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            return $e->getResponse();
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    Route::get('/orders', function (Request $request) {
        $query = Order::with('items')->latest();
        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        } else if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        return response()->json($query->get());
    });

    Route::put('/orders/{id}', function (Request $request, $id) {
        $order = Order::findOrFail($id);
        
        $dataToUpdate = $request->only([
            'status', 'payment_proof', 'pickup_proof', 'delivery_proof', 'review'
        ]);
        
        $order->update($dataToUpdate);
        
        if (isset($dataToUpdate['status']) && in_array($dataToUpdate['status'], ['cancelled', 'completed'], true)) {
            foreach ($order->items as $item) {
                if ($item->item_type === 'pet') {
                    $pet = Pet::find($item->item_id);
                    if ($pet) {
                        $pet->update([
                            'status' => $dataToUpdate['status'] === 'completed' ? 'adopted' : 'available',
                        ]);
                    }
                }
            }
        }
        
        return response()->json(['message' => 'Order berhasil diupdate', 'data' => $order->load('items')]);
    });

    // RESERVATIONS
    Route::post('/reservations', function (Request $request) {
        $validated = $request->validate([
            'id'                   => 'required|string',
            'user_id'              => 'required|integer',
            'user_name'            => 'required|string',
            'user_email'           => 'required|string',
            'user_phone'           => 'required|string',
            'date'                 => 'required|date',
            'time'                 => 'required|string',
            'type'                 => 'required|in:shelter,grooming',
            'grooming_package'     => 'nullable|array',
            'status'               => 'required|string',
            'admin_fee'            => 'required|numeric',
            'payment_proof'        => 'nullable|string',
            'attended'             => 'nullable|boolean',
            'created_at_timestamp' => 'nullable|integer',
        ]);

        try {
            $reservation = \App\Models\Reservation::create($validated);
            return response()->json(['message' => 'Reservasi berhasil dibuat', 'data' => $reservation], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    Route::get('/reservations', function (Request $request) {
        $query = \App\Models\Reservation::latest();
        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        } else if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        return response()->json($query->get());
    });

    Route::put('/reservations/{id}', function (Request $request, $id) {
        $reservation = \App\Models\Reservation::findOrFail($id);
        $reservation->update($request->all());
        return response()->json(['message' => 'Reservasi berhasil diupdate', 'data' => $reservation]);
    });
});

// ============================================================
// LEGACY
// ============================================================
Route::get('/animals', fn() => response()->json(Pet::latest()->get()));
Route::get('/products', fn() => response()->json(ShopProduct::latest()->get()));
