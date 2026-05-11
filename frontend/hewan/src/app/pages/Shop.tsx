import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/useCart';
import { Product } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingCart, Plus, Minus, Loader2, Search, X, CheckCircle } from 'lucide-react';
import { createOrder, getShopProducts, uploadImage } from '../services/api';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { useModalAlert } from '../components/ui/modal-alert';

interface ShopProduct {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}

interface SuccessPopupState {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  actionPath: string;
}

export default function Shop() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [cartNotice, setCartNotice] = useState('');
  const [successPopup, setSuccessPopup] = useState<SuccessPopupState>({
    open: false,
    title: '',
    message: '',
    actionLabel: '',
    actionPath: '',
  });
  const [checkoutProduct, setCheckoutProduct] = useState<ShopProduct | null>(null);
  const [checkoutDeliveryMethod, setCheckoutDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [checkoutPaymentProof, setCheckoutPaymentProof] = useState<File | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutIsEdit, setCheckoutIsEdit] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { showAlert, Modal } = useModalAlert();
  const navigate = useNavigate();

  const [checkoutUser, setCheckoutUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useLiveRefresh(() => fetchProducts(true), ['products'], 7000, [selectedCategory]);

  useEffect(() => {
    if (user) {
      setCheckoutUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getShopProducts(selectedCategory);
      setProducts(data.filter((product: ShopProduct) => product.stock > 0));
    } catch (e) {
      setError('Gagal memuat data produk. Pastikan server backend berjalan.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const categories = [
    { id: 'all',       name: 'Semua Produk', icon: '🛍️' },
    { id: 'baju',      name: 'Baju',         icon: '👕' },
    { id: 'aksesoris', name: 'Aksesoris',    icon: '🎀' },
    { id: 'makanan',   name: 'Makanan',      icon: '🍗' },
    { id: 'snack',     name: 'Snack',        icon: '🦴' },
    { id: 'pasir',     name: 'Pasir',        icon: '🪣' },
    { id: 'alat-makan', name: 'Alat Makan', icon: '🍽️' },
    { id: 'alat-minum', name: 'Alat Minum', icon: '💧' },
    { id: 'kandang',   name: 'Kandang',      icon: '🏠' },
    { id: 'alat-tidur', name: 'Alat Tidur', icon: '🛏️' },
  ];

  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
  };

const handleAddToCart = (product: ShopProduct) => {
  if (!isAuthenticated) {
    navigate('/login');
    return;
  }

  const quantity = quantities[product.id] || 1;

  addToCart({
    type: 'product',
    item: { ...product, id: String(product.id) } as Product,
    quantity
  });

  setCartNotice(`${product.name} (${quantity}x) masuk keranjang`);
  setTimeout(() => setCartNotice(''), 1800);

  setQuantities(prev => ({
    ...prev,
    [product.id]: 1
  }));
};

  const openCheckoutNow = (product: ShopProduct) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCheckoutProduct(product);
    setCheckoutDeliveryMethod('pickup');
    setCheckoutPaymentProof(null);
    setCheckoutIsEdit(false);
  };

  const confirmCheckoutNow = async () => {
    if (!checkoutProduct || !user) return;

    if (!checkoutPaymentProof) {
      showAlert(
        'Mohon upload bukti transfer terlebih dahulu sebelum konfirmasi pesanan.',
        'warning',
        'Bukti Transfer Diperlukan'
      );
      return;
    }

    const quantity = quantities[checkoutProduct.id] || 1;
    const deliveryFee = checkoutDeliveryMethod === 'delivery' ? 50000 : 0;
    const total = checkoutProduct.price * quantity + deliveryFee;

    setCheckoutSubmitting(true);

    try {
      const uniqueCode = 'MH' + Date.now().toString().slice(-8);
      const uploadedProofUrl = await uploadImage(checkoutPaymentProof);

      await createOrder({
        id: uniqueCode,
        user_id: user.id,
        user_data: {
          name: checkoutUser.name,
          email: checkoutUser.email,
          phone: checkoutUser.phone,
          address: checkoutUser.address,
        },
        order_type: 'product',
        status: 'pending',
        total_amount: total,
        delivery_method: checkoutDeliveryMethod,
        delivery_fee: deliveryFee,
        payment_proof: uploadedProofUrl,
        unique_code: uniqueCode,
        items: [{
          item_type: 'product',
          item_id: String(checkoutProduct.id),
          quantity,
          price: checkoutProduct.price,
          item_snapshot: { ...checkoutProduct, id: String(checkoutProduct.id) },
        }],
      });

      setCheckoutProduct(null);
      setCheckoutPaymentProof(null);
      setSuccessPopup({
        open: true,
        title: 'Pesanan Berhasil!',
        message: `Pesanan ${uniqueCode} masuk waiting list`,
        actionLabel: 'Lihat Aktivitas',
        actionPath: '/aktivitas',
      });
      fetchProducts(true);
    } catch (err: any) {
      showAlert(err.message || 'Gagal membuat pesanan. Coba lagi.', 'error', 'Pesanan Gagal');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {Modal}
      <AnimatePresence>
        {cartNotice && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.98 }}
            className="fixed left-1/2 top-20 z-[9999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-white px-5 py-4 text-center shadow-2xl"
          >
            <div className="mb-1 text-2xl">🎉</div>
            <h2 className="text-base font-extrabold text-purple-600">Keranjang Berhasil!</h2>
            <p className="mt-1 text-xs font-medium text-gray-500">{cartNotice}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successPopup.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex min-h-dvh items-center justify-center bg-black/55 px-4 backdrop-blur-[1px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white px-6 py-5 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 text-3xl">🎉</div>
              <h2 className="text-lg font-extrabold text-purple-600">{successPopup.title}</h2>
              <p className="mt-1 text-xs font-medium text-gray-500">{successPopup.message}</p>
              <Button
                className="mt-5 w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 font-bold text-white hover:from-pink-600 hover:to-purple-600"
                onClick={() => {
                  setSuccessPopup(prev => ({ ...prev, open: false }));
                  navigate(successPopup.actionPath);
                }}
              >
                {successPopup.actionLabel}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4 pb-2 sm:text-4xl md:text-5xl"
        >
          Toko Perlengkapan Hewan
        </motion.h1>
        <p className="text-base text-gray-700 sm:text-xl">Lengkapi kebutuhan hewan peliharaan Anda</p>
        <div className="mt-4 bg-blue-50 p-4 rounded-lg inline-block">
          <p className="text-lg font-semibold text-blue-700">📍 Toko Offline: Jl. Bekalivron No. 25, Bandung</p>
          <p className="text-lg text-blue-600">Pengiriman hanya untuk wilayah Bandung Kota</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau kategori produk..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-700 shadow-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Menampilkan <strong>{filteredProducts.length}</strong> hasil untuk "<em>{searchQuery}</em>"
          </p>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className={`whitespace-nowrap ${selectedCategory === cat.id ? 'bg-gradient-to-r from-blue-500 to-green-500' : ''}`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-gray-500">Memuat data produk...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16 bg-red-50 rounded-xl">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold">{error}</p>
          <Button onClick={() => fetchProducts()} className="mt-4 bg-blue-500">Coba Lagi</Button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 font-semibold">
            {searchQuery ? `Produk "${searchQuery}" tidak ditemukan` : 'Tidak ada produk tersedia'}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-500 underline text-sm">Hapus pencarian</button>
          )}
        </div>
      )}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400';
                    }}
                  />
                  {product.stock < 5 && product.stock > 0 && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">Stok Terbatas</Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500">Habis</Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">Stok: {product.stock}</p>
                    </div>
                  </div>

                  {product.stock > 0 ? (
                    <>
                      <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                        <Button size="sm" variant="outline" onClick={() => handleQuantityChange(product.id, -1)} disabled={(quantities[product.id] || 1) <= 1}>
                          <Minus size={16} />
                        </Button>
                        <span className="font-bold text-lg px-4">{quantities[product.id] || 1}</span>
                        <Button size="sm" variant="outline" onClick={() => handleQuantityChange(product.id, 1)} disabled={(quantities[product.id] || 1) >= product.stock}>
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button onClick={() => handleAddToCart(product)} className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-xs sm:text-sm">
                          <ShoppingCart className="mr-1" size={16} /> Keranjang
                        </Button>
                        <Button
                          onClick={() => openCheckoutNow(product)}
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                        >
                          <CheckCircle className="mr-1" size={16} /> Checkout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button disabled className="w-full">Stok Habis</Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🛍️</div>
              <p className="text-xl text-gray-600">Belum ada produk dalam kategori ini</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!checkoutProduct} onOpenChange={(open) => !open && setCheckoutProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Checkout Pesanan</DialogTitle>
            <DialogDescription>
              Lengkapi informasi pengiriman dan pembayaran
            </DialogDescription>
          </DialogHeader>

          {checkoutProduct && (
            <div className="space-y-5">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">Informasi Pembeli:</h4>
                  <button
                    onClick={() => setCheckoutIsEdit(!checkoutIsEdit)}
                    className="text-sm text-blue-600 font-semibold"
                  >
                    {checkoutIsEdit ? 'Selesai' : 'Edit'}
                  </button>
                </div>

                {!checkoutIsEdit ? (
                  <div className="space-y-1 text-sm">
                    <p><strong>Nama:</strong> {checkoutUser.name}</p>
                    <p><strong>Email:</strong> {checkoutUser.email}</p>
                    <p><strong>No. HP:</strong> {checkoutUser.phone}</p>
                    <p><strong>Alamat:</strong> {checkoutUser.address}</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label htmlFor="checkout-name">Nama:</Label>
                      <Input
                        id="checkout-name"
                        type="text"
                        value={checkoutUser.name}
                        onChange={(e) => setCheckoutUser({ ...checkoutUser, name: e.target.value })}
                        className="border-blue-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout-email">Email:</Label>
                      <Input
                        id="checkout-email"
                        type="email"
                        value={checkoutUser.email}
                        onChange={(e) => setCheckoutUser({ ...checkoutUser, email: e.target.value })}
                        className="border-blue-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout-phone">No. HP:</Label>
                      <Input
                        id="checkout-phone"
                        type="text"
                        placeholder="Masukkan nomor HP aktif"
                        value={checkoutUser.phone}
                        onChange={(e) => setCheckoutUser({ ...checkoutUser, phone: e.target.value })}
                        className="border-blue-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout-address">Alamat Pengiriman:</Label>
                      <textarea
                        id="checkout-address"
                        placeholder="Masukkan alamat lengkap"
                        value={checkoutUser.address}
                        onChange={(e) => setCheckoutUser({ ...checkoutUser, address: e.target.value })}
                        className="w-full border border-blue-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-blue-100 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">Item Checkout:</h4>
                  <span className="text-sm text-gray-600">
                    {quantities[checkoutProduct.id] || 1} item
                  </span>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{checkoutProduct.name}</p>
                    <p className="text-gray-500">
                      {quantities[checkoutProduct.id] || 1} x Rp {checkoutProduct.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="font-semibold text-blue-600 whitespace-nowrap">
                    Rp {(checkoutProduct.price * (quantities[checkoutProduct.id] || 1)).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Metode Pengiriman:</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <Button
                    type="button"
                    variant={checkoutDeliveryMethod === 'pickup' ? 'default' : 'outline'}
                    onClick={() => setCheckoutDeliveryMethod('pickup')}
                    className={checkoutDeliveryMethod === 'pickup' ? 'bg-blue-600' : ''}
                  >
                    Ambil di Toko (Gratis)
                  </Button>
                  <Button
                    type="button"
                    variant={checkoutDeliveryMethod === 'delivery' ? 'default' : 'outline'}
                    onClick={() => setCheckoutDeliveryMethod('delivery')}
                    className={checkoutDeliveryMethod === 'delivery' ? 'bg-blue-600' : ''}
                  >
                    Kurir Rp 50.000
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
                <h4 className="font-bold">Rincian Pembayaran:</h4>
                <div className="flex justify-between text-sm">
                  <span>Subtotal Produk:</span>
                  <span>
                    Rp {(checkoutProduct.price * (quantities[checkoutProduct.id] || 1)).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ongkir:</span>
                  <span>Rp {(checkoutDeliveryMethod === 'delivery' ? 50000 : 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center font-bold pt-2 border-t">
                  <span className="text-2xl">Total:</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    Rp {(checkoutProduct.price * (quantities[checkoutProduct.id] || 1) + (checkoutDeliveryMethod === 'delivery' ? 50000 : 0)).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t mt-2 text-center">
                  <p className="text-lg">Transfer ke BCA:</p>
                  <p className="text-3xl font-bold text-purple-500">24518266</p>
                  <p className="text-2xl font-bold mt-2">a.n. Meow my home</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Bukti Transfer</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCheckoutPaymentProof(e.target.files?.[0] || null)}
                />
                {checkoutPaymentProof && (
                  <img
                    src={URL.createObjectURL(checkoutPaymentProof)}
                    alt="Preview bukti transfer"
                    className="h-28 w-28 rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="sticky bottom-0 bg-white pt-4">
                <Button
                  onClick={confirmCheckoutNow}
                  disabled={checkoutSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  size="lg"
                >
                  {checkoutSubmitting ? (
                    <Loader2 className="mr-2 animate-spin" size={18} />
                  ) : (
                    <CheckCircle className="mr-2" size={18} />
                  )}
                  {checkoutSubmitting ? 'Memproses...' : 'Konfirmasi Pesanan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
