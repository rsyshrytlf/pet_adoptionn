/// <reference types="vite/client" />

import { mockProducts } from '../data/mockData';
import { emitDataChanged } from '../hooks/useLiveRefresh';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const networkErrorMessage = () =>
  `Tidak dapat terhubung ke server. Pastikan backend Laravel berjalan dan alamat API benar (${BASE_URL}).`;

const requestJson = async <T = any>(url: string, options?: RequestInit): Promise<T> => {
  let res: Response;

  // Coba ambil token dari localStorage
  const savedUser = localStorage.getItem('currentUser');
  let token = '';
  if (savedUser) {
    try {
      const userObj = JSON.parse(savedUser);
      if (userObj.token) token = userObj.token;
    } catch (e) {}
  }

  const headers: HeadersInit = options?.body instanceof FormData
    ? { ...options.headers }
    : { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  try {
    res = await fetch(url, {
      headers,
      ...options,
    });
  } catch {
    throw new Error(networkErrorMessage());
  }

  if (res.status === 401) {
    // Token tidak valid atau kadaluwarsa, paksa logout
    window.dispatchEvent(new Event('auth_unauthorized'));
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(String(firstError || data.message || data.error || 'Request gagal diproses'));
  }

  return data;
};

const fallbackShopProducts = mockProducts.map((product, index) => ({
  ...product,
  id: index + 1,
  image: product.image.includes('?') ? product.image : `${product.image}?w=400`,
}));

// Upload gambar ke backend, dipakai untuk bukti transfer, bukti pengiriman, foto hewan, dan produk.
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const data = await requestJson<{ url: string }>(`${BASE_URL}/upload`, { method: 'POST', body: formData });
  return data.url;
};

// Mengambil daftar hewan, bisa difilter berdasarkan jenis seperti kucing/anjing.
export const getPets = async (type?: string) => {
  const url = type && type !== 'all' ? `${BASE_URL}/pets?type=${type}` : `${BASE_URL}/pets`;
  return requestJson(url);
};

// Mengambil detail satu hewan berdasarkan ID.
export const getPetById = async (id: string | number) => requestJson(`${BASE_URL}/pets/${id}`);

// Admin menambahkan data hewan baru.
export const createPet = async (data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/pets`, { method: 'POST', body: JSON.stringify(data) });
  emitDataChanged('pets');
  return result;
};

// Admin mengubah data hewan, misalnya status, nama, foto, atau deskripsi.
export const updatePet = async (id: string | number, data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/pets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  emitDataChanged('pets');
  return result;
};

// Admin menghapus data hewan dari backend.
export const deletePet = async (id: string | number) => {
  const result = await requestJson(`${BASE_URL}/pets/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
  emitDataChanged('pets');
  return result;
};

// Mengambil daftar produk toko. Jika backend tidak tersambung, tampilkan data cadangan agar halaman tidak kosong.
export const getShopProducts = async (category?: string) => {
  const url = category && category !== 'all' ? `${BASE_URL}/shop-products?category=${category}` : `${BASE_URL}/shop-products`;
  try {
    return await requestJson(url);
  } catch {
    return category && category !== 'all' ? fallbackShopProducts.filter(product => product.category === category) : fallbackShopProducts;
  }
};

// Admin menambahkan produk baru ke toko.
export const createShopProduct = async (data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/shop-products`, { method: 'POST', body: JSON.stringify(data) });
  emitDataChanged('products');
  return result;
};

// Admin mengubah data produk, termasuk stok, harga, kategori, dan gambar.
export const updateShopProduct = async (id: string | number, data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/shop-products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  emitDataChanged('products');
  return result;
};

// Admin menghapus produk dari toko.
export const deleteShopProduct = async (id: string | number) => {
  const result = await requestJson(`${BASE_URL}/shop-products/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
  emitDataChanged('products');
  return result;
};

// Mengambil data pesanan. Jika userId dikirim, hanya mengambil pesanan milik user tersebut.
export const getOrders = async (userId?: string) => {
  const url = userId ? `${BASE_URL}/orders?user_id=${userId}` : `${BASE_URL}/orders`;
  const data = await requestJson<any[]>(url);
  return data.map((order: any) => ({
    id: order.id,
    userId: String(order.user_id),
    userData: order.user_data,
    orderType: order.order_type,
    status: order.status,
    totalAmount: Number(order.total_amount),
    deliveryMethod: order.delivery_method,
    deliveryFee: Number(order.delivery_fee),
    paymentProof: order.payment_proof,
    pickupProof: order.pickup_proof,
    deliveryProof: order.delivery_proof,
    uniqueCode: order.unique_code,
    expiresAt: order.expires_at,
    review: order.review,
    createdAt: new Date(order.created_at),
    updatedAt: order.updated_at ? new Date(order.updated_at) : new Date(order.created_at),
    items: order.items ? order.items.map((item: any) => ({
      item_type: item.item_type,
      item_id: item.item_id,
      quantity: item.quantity,
      price: item.price,
      item_snapshot: item.item_snapshot,
      type: item.item_type,
      item: item.item_snapshot || { id: item.item_id, price: item.price },
    })) : [],
  }));
};

// Membuat pesanan baru dari checkout keranjang, checkout langsung produk, atau adopsi.
export const createOrder = async (data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/orders`, { method: 'POST', body: JSON.stringify(data) });
  emitDataChanged('orders');
  emitDataChanged('products');
  emitDataChanged('pets');
  return result;
};

// Mengubah status/detail pesanan, misalnya pending, processing, shipped, ready, atau completed.
export const updateOrder = async (id: string, data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  emitDataChanged('orders');
  emitDataChanged('products');
  emitDataChanged('pets');
  return result;
};

// Mengambil paket grooming yang ditampilkan di halaman reservasi.
export const getGroomingPackages = async () => requestJson(`${BASE_URL}/grooming-packages`);

// Mengambil data reservasi. Jika userId dikirim, hanya mengambil reservasi milik user tersebut.
export const getReservations = async (userId?: string) => {
  const url = userId ? `${BASE_URL}/reservations?user_id=${userId}` : `${BASE_URL}/reservations`;
  const data = await requestJson<any[]>(url);
  return data.map((r: any) => ({
    id: r.id,
    userId: String(r.user_id),
    userName: r.user_name,
    userEmail: r.user_email,
    userPhone: r.user_phone,
    date: r.date,
    time: r.time,
    type: r.type,
    groomingPackage: r.grooming_package,
    status: r.status,
    adminFee: Number(r.admin_fee),
    paymentProof: r.payment_proof,
    attended: r.attended,
    createdAt: r.created_at_timestamp || new Date(r.created_at).getTime(),
  }));
};

// Membuat reservasi shelter/grooming setelah user memilih tanggal, jam, dan upload bukti transfer.
export const createReservation = async (data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/reservations`, { method: 'POST', body: JSON.stringify(data) });
  emitDataChanged('reservations');
  return result;
};

// Admin mengubah status reservasi, misalnya dikonfirmasi, ditolak, atau selesai.
export const updateReservation = async (id: string, data: Record<string, any>) => {
  const result = await requestJson(`${BASE_URL}/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  emitDataChanged('reservations');
  return result;
};

// Mengambil detail user berdasarkan ID jika suatu halaman membutuhkan data user terbaru.
export const getUserById = async (id: string | number) => requestJson(`${BASE_URL}/users/${id}`);

// Mengirim OTP lupa password ke email user.
export const requestPasswordOtp = async (email: string) => {
  try {
    return await requestJson(`${BASE_URL}/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) });
  } catch (error: any) {
    throw new Error(error.message || 'Gagal mengirim OTP. Pastikan server backend berjalan.');
  }
};

// Mengganti password user memakai OTP yang sudah dikirim lewat email.
export const resetPasswordWithOtp = async (data: {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}) => {
  return requestJson(`${BASE_URL}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Menghapus token di backend (Sanctum)
export const logoutApi = async () => {
  try {
    await requestJson(`${BASE_URL}/logout`, { method: 'POST' });
  } catch (error) {
    // Abaikan error jika token sudah tidak valid
  }
};
