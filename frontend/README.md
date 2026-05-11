# 🐾 PetAdopt — Frontend

Aplikasi web frontend untuk platform adopsi hewan peliharaan, dibangun menggunakan **React + TypeScript + Vite**.

---

## 🛠️ Tech Stack

| Teknologi | Keterangan |
|---|---|
| React 19 | Library UI utama |
| TypeScript | Pengetikan statis |
| Vite | Build tool & dev server |
| React Router v7 | Client-side routing |
| Tailwind CSS | Utility-first CSS framework |
| shadcn/ui | Komponen UI siap pakai |
| Sonner | Notifikasi toast |

---

## 📁 Struktur Folder

```
frontend/hewan/src/
├── main.tsx                  # Entry point aplikasi
├── styles/                   # File CSS global
└── app/
    ├── App.tsx               # Root komponen React
    ├── routes.tsx            # Definisi semua rute aplikasi
    ├── types.ts              # TypeScript interface & type global
    ├── pages/                # Halaman-halaman utama
    │   ├── Home.tsx
    │   ├── Login.tsx
    │   ├── LoginAdmin.tsx
    │   ├── Register.tsx
    │   ├── Adoption.tsx
    │   ├── PetDetail.tsx
    │   ├── Reservation.tsx
    │   ├── Shop.tsx
    │   ├── Cart.tsx
    │   ├── Activity.tsx
    │   └── admin/
    │       ├── AdminDashboard.tsx
    │       ├── AdminPets.tsx
    │       ├── AdminProducts.tsx
    │       ├── AdminOrders.tsx
    │       ├── AdminReservations.tsx
    │       ├── AdminReviews.tsx
    │       └── AdminReports.tsx
    ├── components/
    │   ├── Layout.tsx
    │   ├── figma/
    │   │   └── ImageWithFallback.tsx
    │   └── ui/               # 49 komponen shadcn/ui
    ├── context/
    │   ├── AuthContext.tsx
    │   └── CartContext.tsx
    ├── hooks/
    │   └── useAdminNotifications.ts
    ├── services/
    │   └── api.ts
    └── data/
        └── mockData.ts
```

---

## 📄 Penjelasan File

### `main.tsx`
Entry point aplikasi. Merender `App` ke DOM dan membungkusnya dengan `RouterProvider`.

### `app/App.tsx`
Root komponen yang membungkus seluruh aplikasi dengan `AuthProvider` dan `CartProvider`.

### `app/routes.tsx`
Mendefinisikan semua rute URL dengan `createBrowserRouter`.

| Path | Komponen | Keterangan |
|---|---|---|
| `/` | `Home` | Halaman utama |
| `/login` | `Login` | Login user biasa |
| `/register` | `Register` | Registrasi akun baru |
| `/adopsi` | `Adoption` | Daftar hewan untuk diadopsi |
| `/adopsi/:id` | `PetDetail` | Detail hewan tertentu |
| `/reservasi` | `Reservation` | Form reservasi shelter/grooming |
| `/belanja` | `Shop` | Toko produk hewan |
| `/keranjang` | `Cart` | Keranjang belanja & checkout |
| `/aktivitas` | `Activity` | Riwayat pesanan & reservasi |
| `/admin` | `AdminDashboard` | Layout dashboard admin |
| `/admin/hewan` | `AdminPets` | Manajemen data hewan |
| `/admin/produk` | `AdminProducts` | Manajemen produk toko |
| `/admin/pesanan` | `AdminOrders` | Manajemen semua pesanan |
| `/admin/reservasi` | `AdminReservations` | Manajemen reservasi |
| `/admin/review` | `AdminReviews` | Moderasi ulasan |
| `/admin/laporan` | `AdminReports` | Laporan & statistik |

### `app/types.ts`
Berisi semua TypeScript interface global.

| Interface | Keterangan |
|---|---|
| `User` | Data pengguna (id, email, name, address, phone, isAdmin) |
| `Pet` | Data hewan adopsi (nama, jenis, ras, umur, status, gambar) |
| `Product` | Data produk toko (nama, kategori, harga, stok) |
| `GroomingPackage` | Paket layanan grooming |
| `CartItem` | Item dalam keranjang belanja |
| `Order` | Data pesanan (adopsi / produk / grooming) |
| `Reservation` | Data reservasi shelter / grooming |
| `Review` | Data ulasan dari pengguna |

---

## 📄 Halaman (Pages)

### `pages/Home.tsx`
Landing page utama. Menampilkan hero section, fitur layanan, hewan unggulan, dan call-to-action.

### `pages/Login.tsx`
Login user biasa via `POST /api/login`. Memblokir akun dengan role `admin`.

### `pages/LoginAdmin.tsx`
Login khusus administrator. Hanya akun dengan role `admin` yang bisa masuk.

### `pages/Register.tsx`
Pendaftaran akun baru. Mengumpulkan nama, email, password, alamat, dan telepon, lalu mengirimnya ke `POST /api/register`. Keranjang dibersihkan setelah registrasi.

### `pages/Adoption.tsx`
Daftar hewan yang tersedia untuk diadopsi. Dilengkapi filter jenis (kucing, anjing, kelinci) dan pencarian nama. Data dari `GET /api/pets`.

### `pages/PetDetail.tsx`
Detail hewan: foto carousel, informasi lengkap (kepribadian, makanan favorit, kisah penyelamatan), dan tombol tambah ke keranjang adopsi.

### `pages/Reservation.tsx`
Form reservasi **Shelter Visit** dan **Grooming**. Pengguna memilih tanggal, waktu, paket, dan upload bukti bayar. Disimpan via `POST /api/reservations`.

### `pages/Shop.tsx`
Toko produk hewan dengan filter kategori dan fitur pencarian. Produk dapat ditambahkan ke keranjang.

### `pages/Cart.tsx`
Keranjang belanja & checkout. Memilih metode pengiriman (ambil / antar) dan upload bukti pembayaran untuk menyelesaikan pesanan.

### `pages/Activity.tsx`
Riwayat aktivitas user: semua **pesanan** dan **reservasi**. Fitur:
- Countdown timer (HH:MM:SS) untuk pesanan belum bayar
- Status pesanan real-time
- Tombol batalkan pesanan aktif
- Tombol beri ulasan untuk pesanan selesai

---

## 📄 Halaman Admin

### `admin/AdminDashboard.tsx`
Layout panel admin dengan sidebar navigasi dan **notifikasi real-time** untuk pesanan, reservasi, dan review baru.

### `admin/AdminPets.tsx`
Manajemen data hewan: tambah, edit, hapus, upload foto, ubah status (tersedia / dipesan / diadopsi).

### `admin/AdminProducts.tsx`
Manajemen produk toko: tambah, edit, hapus beserta kategori, harga, stok, dan gambar.

### `admin/AdminOrders.tsx`
Manajemen pesanan: lihat detail, verifikasi bukti bayar, ubah status (pending → confirmed → completed / cancelled).

### `admin/AdminReservations.tsx`
Manajemen reservasi: konfirmasi kehadiran dan ubah status reservasi.

### `admin/AdminReviews.tsx`
Moderasi ulasan: setujui atau tolak ulasan dari pengguna.

### `admin/AdminReports.tsx`
Laporan & statistik: ringkasan pendapatan, jumlah pesanan per kategori, dan grafik performa.

---

## 📄 Components

### `components/Layout.tsx`
Layout utama semua halaman. Berisi **Navbar** (navigasi, status login, icon keranjang) dan **Footer**.

### `components/figma/ImageWithFallback.tsx`
Komponen `<img>` yang menampilkan placeholder jika URL gambar gagal dimuat (`onError` fallback).

### `components/ui/`
49 komponen UI dari **shadcn/ui**, di antaranya:

| File | Fungsi |
|---|---|
| `button.tsx` | Tombol dengan berbagai varian |
| `dialog.tsx` | Modal / popup |
| `table.tsx` | Tabel data |
| `badge.tsx` | Label status berwarna |
| `card.tsx` | Kartu konten |
| `input.tsx` | Input field |
| `select.tsx` | Dropdown |
| `calendar.tsx` | Pemilih tanggal |
| `chart.tsx` | Grafik laporan admin |
| `sidebar.tsx` | Sidebar navigasi admin |
| `carousel.tsx` | Slider gambar |
| `skeleton.tsx` | Loading placeholder |
| `modal-alert.tsx` | Dialog konfirmasi custom |
| `sonner.tsx` | Notifikasi toast |

---

## 📄 Context

### `context/AuthContext.tsx`
State autentikasi global menggunakan React Context API.

| Fungsi / State | Keterangan |
|---|---|
| `user` | Data user aktif (null = belum login) |
| `isAuthenticated` | Boolean status login |
| `isAdmin` | Boolean cek role admin |
| `login(email, password)` | Login user biasa |
| `loginAdmin(email, password)` | Login admin (filter role) |
| `register(...)` | Daftar akun baru |
| `logout()` | Hapus sesi + bersihkan keranjang |

Sesi disimpan di `localStorage` agar bertahan saat refresh.

### `context/CartContext.tsx`
State keranjang belanja global.

| Fungsi / State | Keterangan |
|---|---|
| `items` | Array item di keranjang |
| `addItem(item)` | Tambah item |
| `removeItem(index)` | Hapus item |
| `clearCart()` | Kosongkan keranjang |
| `totalItems` | Total item (badge Navbar) |

---

## 📄 Hooks

### `hooks/useAdminNotifications.ts`
Custom hook notifikasi real-time admin. Polling API berkala untuk cek:
- Pesanan baru (status `unpaid`/`pending`)
- Reservasi baru (status `pending`)
- Ulasan baru yang belum disetujui

---

## 📄 Services

### `services/api.ts`
Modul terpusat semua komunikasi HTTP ke backend. Base URL: `http://localhost:8000/api`.

| Fungsi | Method | Endpoint | Keterangan |
|---|---|---|---|
| `uploadImage(file)` | POST | `/upload` | Upload gambar, return URL |
| `getPets(type?)` | GET | `/pets` | Ambil hewan, filter jenis |
| `getPetById(id)` | GET | `/pets/:id` | Detail satu hewan |
| `createPet(data)` | POST | `/pets` | Tambah hewan |
| `updatePet(id, data)` | PUT | `/pets/:id` | Update hewan |
| `deletePet(id)` | DELETE | `/pets/:id` | Hapus hewan |
| `getShopProducts(cat?)` | GET | `/shop-products` | Ambil produk toko |
| `createShopProduct(data)` | POST | `/shop-products` | Tambah produk |
| `updateShopProduct(id,d)` | PUT | `/shop-products/:id` | Update produk |
| `deleteShopProduct(id)` | DELETE | `/shop-products/:id` | Hapus produk |
| `getOrders(userId?)` | GET | `/orders` | Ambil pesanan |
| `createOrder(data)` | POST | `/orders` | Buat pesanan |
| `updateOrder(id, data)` | PUT | `/orders/:id` | Update status pesanan |
| `getReservations(uid?)` | GET | `/reservations` | Ambil reservasi |
| `createReservation(data)` | POST | `/reservations` | Buat reservasi |
| `updateReservation(id,d)` | PUT | `/reservations/:id` | Update reservasi |

> `getOrders` dan `getReservations` otomatis mengubah format `snake_case` (DB) ke `camelCase` (frontend).

---

## 📄 Data

### `data/mockData.ts`
Data statis sebagai fallback: daftar paket grooming, harga shelter, dummy hewan & produk.

---

## 🚀 Cara Menjalankan

```bash
cd frontend/hewan
npm install
npm run dev
```

Aplikasi berjalan di **http://localhost:5173**

> Pastikan backend Laravel sudah berjalan di `http://localhost:8000`.
