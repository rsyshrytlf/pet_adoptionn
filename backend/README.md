# 🐾 PetAdopt — Backend

REST API backend untuk platform adopsi hewan peliharaan, dibangun menggunakan **Laravel 11 (PHP)** dengan database **PostgreSQL / MySQL**.

---

## 🛠️ Tech Stack

| Teknologi | Keterangan |
|---|---|
| Laravel 11 | PHP framework utama |
| PHP 8.2+ | Bahasa pemrograman |
| PostgreSQL / MySQL | Database relasional |
| Eloquent ORM | Query builder & model |
| Laravel Sanctum | (Opsional) Autentikasi token |

---

## 📁 Struktur Folder

```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── Controller.php       # Base controller
│   │       └── PetController.php    # Controller hewan (legacy)
│   ├── Models/
│   │   ├── User.php
│   │   ├── Pet.php
│   │   ├── ShopProduct.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Reservation.php
│   │   ├── Animal.php
│   │   └── Product.php
│   └── Providers/
│       └── AppServiceProvider.php
├── database/
│   ├── migrations/               # Skema tabel database
│   └── seeders/                  # Data awal (seeder)
├── routes/
│   ├── api.php                   # Semua endpoint REST API
│   ├── web.php                   # Route web (tidak digunakan aktif)
│   └── console.php               # Perintah artisan kustom
├── public/
│   └── uploads/                  # Folder penyimpanan gambar upload
├── .env                          # Konfigurasi environment
└── artisan                       # CLI Laravel
```

---

## 📄 Penjelasan Models

### `Models/User.php`
Model untuk tabel `users`. Menyimpan data akun pengguna.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key auto-increment |
| `name` | string | Nama lengkap |
| `email` | string | Email unik |
| `password` | hashed | Password (otomatis di-hash via cast) |
| `role` | string | Role akun: `user` atau `admin` |

Password secara otomatis di-hash menggunakan Laravel cast `hashed`.

### `Models/Pet.php`
Model untuk tabel `pets`. Menyimpan semua data hewan adopsi.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `name` | string | Nama hewan |
| `type` | string | Jenis: kucing / anjing / kelinci |
| `breed` | string | Ras hewan |
| `gender` | string | Jenis kelamin: jantan / betina |
| `age` | string | Umur hewan |
| `description` | text | Deskripsi umum |
| `personality` | text | Kepribadian |
| `favorite_food` | string | Makanan favorit |
| `favorite_toy` | string | Mainan favorit |
| `health` | text | Catatan kesehatan |
| `rescue_story` | text | Kisah penyelamatan |
| `suitable_for` | text | Cocok untuk siapa |
| `images` | JSON | Array URL gambar |
| `status` | string | available / booked / adopted |
| `price` | integer | Biaya adopsi |

### `Models/ShopProduct.php`
Model untuk tabel `shop_products`. Menyimpan produk yang dijual di toko.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `name` | string | Nama produk |
| `category` | string | Kategori produk |
| `description` | text | Deskripsi produk |
| `price` | integer | Harga satuan |
| `image` | string | URL gambar produk |
| `stock` | integer | Jumlah stok tersedia |

### `Models/Order.php`
Model untuk tabel `orders`. Menyimpan semua transaksi (adopsi, produk, grooming).

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string | UUID / ID custom dari frontend |
| `user_id` | integer | FK ke tabel users |
| `user_data` | JSON | Snapshot data user saat pesan |
| `order_type` | string | adoption / product / grooming |
| `status` | string | unpaid / pending / confirmed / completed / cancelled |
| `total_amount` | decimal | Total harga |
| `delivery_method` | string | pickup / delivery |
| `delivery_fee` | decimal | Biaya pengiriman |
| `payment_proof` | string | URL bukti pembayaran |
| `pickup_proof` | string | URL bukti pengambilan |
| `delivery_proof` | string | URL bukti pengiriman |
| `unique_code` | string | Kode unik pembayaran |
| `expires_at` | bigint | Unix timestamp kadaluarsa pembayaran |
| `review` | JSON | Data ulasan pengguna |

Relasi: `Order` **hasMany** `OrderItem`.

### `Models/OrderItem.php`
Model untuk tabel `order_items`. Menyimpan detail item per pesanan.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `order_id` | string | FK ke tabel orders |
| `item_type` | string | pet / product / grooming |
| `item_id` | string | ID item yang dipesan |
| `quantity` | integer | Jumlah item |
| `price` | decimal | Harga saat dipesan |
| `item_snapshot` | JSON | Snapshot data item (nama, gambar, dll.) |

Relasi: `OrderItem` **belongsTo** `Order`.

### `Models/Reservation.php`
Model untuk tabel `reservations`. Menyimpan data reservasi shelter & grooming.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | string | UUID / ID custom |
| `user_id` | integer | FK ke tabel users |
| `user_name` | string | Nama pemesan |
| `user_email` | string | Email pemesan |
| `user_phone` | string | Nomor telepon pemesan |
| `date` | date | Tanggal kunjungan |
| `time` | string | Waktu kunjungan |
| `type` | string | shelter / grooming |
| `grooming_package` | JSON | Detail paket grooming |
| `status` | string | pending / confirmed / completed / cancelled |
| `admin_fee` | decimal | Biaya admin |
| `payment_proof` | string | URL bukti pembayaran |
| `attended` | boolean | Apakah pengguna datang |
| `created_at_timestamp` | bigint | Unix timestamp dibuat |

### `Models/Animal.php`
Model legacy yang merujuk ke tabel `pets`. Digunakan oleh endpoint lama `/api/animals`.

### `Models/Product.php`
Model legacy yang merujuk ke tabel `shop_products`. Digunakan oleh endpoint lama `/api/products`.

---

## 📄 Penjelasan Controllers

### `Http/Controllers/Controller.php`
Base controller bawaan Laravel. Semua controller lain mewarisi kelas ini.

### `Http/Controllers/PetController.php`
Controller legacy untuk manajemen hewan. Fungsi CRUD dasar sudah dipindahkan ke `routes/api.php` sebagai route closure untuk kesederhanaan.

---

## 📄 Penjelasan Routes (`routes/api.php`)

Semua endpoint API dikelola langsung di file ini menggunakan **route closure** (tanpa controller terpisah).

### 🔐 Autentikasi

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/login` | Login pengguna. Validasi email & password, kembalikan data user + role. |
| POST | `/api/register` | Registrasi akun baru. Validasi email unik, hash password otomatis. |

### 🖼️ Upload Gambar

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/upload` | Upload gambar (JPEG/PNG/GIF/WebP, maks 5MB). File disimpan di `public/uploads/`. Kembalikan URL publik gambar. |

### 🐾 Hewan (Pets)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/pets` | Ambil semua hewan. Query param: `?type=kucing` untuk filter jenis, `?status=available` untuk filter status. |
| GET | `/api/pets/{id}` | Ambil detail satu hewan berdasarkan ID. |
| POST | `/api/pets` | Tambah hewan baru (dengan validasi lengkap). |
| PUT | `/api/pets/{id}` | Update data hewan. |
| DELETE | `/api/pets/{id}` | Hapus hewan. |

### 🛍️ Produk Toko (Shop Products)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/shop-products` | Ambil semua produk. Query param: `?category=makanan`. |
| GET | `/api/shop-products/{id}` | Ambil detail satu produk. |
| POST | `/api/shop-products` | Tambah produk baru. |
| PUT | `/api/shop-products/{id}` | Update produk. |
| DELETE | `/api/shop-products/{id}` | Hapus produk. |

### 📦 Pesanan (Orders)

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/orders` | Buat pesanan baru beserta item-itemnya. Otomatis kurangi stok produk jika `item_type = product`. |
| GET | `/api/orders` | Ambil semua pesanan (dengan relasi items). Query param: `?user_id=1` untuk filter milik user tertentu. |
| PUT | `/api/orders/{id}` | Update pesanan: status, bukti bayar, bukti pickup/delivery, review. Jika status diubah ke `cancelled` dan ada item hewan, status hewan otomatis dikembalikan ke `available`. |

### 📅 Reservasi (Reservations)

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/reservations` | Buat reservasi baru (shelter / grooming). |
| GET | `/api/reservations` | Ambil semua reservasi. Query param: `?user_id=1`. |
| PUT | `/api/reservations/{id}` | Update data reservasi (status, kehadiran, bukti bayar). |

### 🔁 Endpoint Legacy

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/animals` | Alias untuk `/api/pets` (kompatibilitas mundur). |
| GET | `/api/products` | Alias untuk `/api/shop-products` (kompatibilitas mundur). |

---

## 📄 Penjelasan Database Migrations

| File Migration | Tabel | Keterangan |
|---|---|---|
| `0001_01_01_000000_create_users_table.php` | `users` | Tabel pengguna dasar Laravel |
| `0001_01_01_000001_create_cache_table.php` | `cache` | Tabel cache Laravel |
| `0001_01_01_000002_create_jobs_table.php` | `jobs` | Tabel queue job Laravel |
| `2026_04_29_000001_create_pets_table.php` | `pets` | Tabel data hewan adopsi |
| `2026_04_29_000002_create_shop_products_table.php` | `shop_products` | Tabel produk toko |
| `2026_04_29_063759_add_role_to_users_table.php` | `users` | Tambah kolom `role` ke tabel users |
| `2026_04_29_085719_create_orders_table.php` | `orders` | Tabel pesanan |
| `2026_04_29_085720_create_order_items_table.php` | `order_items` | Tabel item per pesanan |
| `2026_04_29_091458_create_reservations_table.php` | `reservations` | Tabel reservasi shelter & grooming |

---

## 🚀 Cara Menjalankan

### 1. Install dependencies

```bash
cd backend
composer install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env` sesuaikan koneksi database:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=petadopt
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 3. Jalankan migrasi database

```bash
php artisan migrate
```

### 4. Buat folder upload (jika belum ada)

```bash
mkdir public/uploads
```

### 5. Jalankan server

```bash
php artisan serve
```

API berjalan di **http://localhost:8000**

---

## ⚙️ Konfigurasi CORS

Agar frontend (localhost:5173) dapat mengakses API, pastikan konfigurasi CORS di `config/cors.php` mengizinkan origin frontend:

```php
'allowed_origins' => ['http://localhost:5173'],
```

---

## 📌 Catatan Penting

- **Password** di-hash otomatis oleh Laravel menggunakan cast `hashed` di `User.php`, tidak perlu `bcrypt()` manual.
- **Gambar upload** disimpan di folder `public/uploads/` dan dapat diakses langsung via URL publik.
- **ID Pesanan & Reservasi** menggunakan string UUID yang di-generate di frontend, bukan auto-increment.
- **Stok produk** otomatis berkurang saat pesanan dibuat dan dikembalikan jika pesanan dibatalkan (khusus hewan).
- **Status hewan** otomatis kembali ke `available` jika pesanan adopsi dibatalkan.
