import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/useCart';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Trash2, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import { Order } from '../types';
import { useModalAlert } from '../components/ui/modal-alert';
import { updatePet, createOrder, uploadImage } from '../services/api';
import { emitDataChanged } from '../hooks/useLiveRefresh';
import { getFallbackItemImage, getItemImage } from '../utils/itemImages';

interface SuccessPopupState {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  actionPath: string;
}

export default function Cart() {
  const { user } = useAuth();
  const { cart, removeFromCart, clearCart, updateCartItem } = useCart();
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updatedItem = { ...cart[index], quantity: newQty };
    updateCartItem(index, updatedItem);
  };
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successPopup, setSuccessPopup] = useState<SuccessPopupState>({
    open: false,
    title: '',
    message: '',
    actionLabel: '',
    actionPath: '',
  });
  const [formUser, setFormUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Sync formUser if user data changes (e.g. after login)
  useEffect(() => {
    if (user) {
      setFormUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();

  const productItems = cart.filter(item => item.type === 'product');
  const petItems = cart.filter(item => item.type === 'pet');

  const calculateTotal = () => {
    let total = 0;

    productItems.forEach(item => {
      if (item.type === 'product') {
        total += (item.item as any).price * (item.quantity || 1);
      }
    });

    return total;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showAlert('Keranjang masih kosong. Tambahkan item terlebih dahulu.', 'warning', 'Keranjang Kosong');
      return;
    }
    setShowCheckoutDialog(true);
  };

  const confirmCheckout = async () => {
    if (!paymentProof) {
      showAlert('Mohon upload bukti transfer terlebih dahulu sebelum konfirmasi pesanan.', 'warning', 'Bukti Transfer Diperlukan');
      return;
    }

    setIsCheckingOut(true);
    try {
      const uniqueCode = 'MH' + Date.now().toString().slice(-8);
      const deliveryFee = deliveryMethod === 'delivery' ? 50000 : 0;
      const total = calculateTotal() + deliveryFee;

      const uploadedProofUrl = await uploadImage(paymentProof);

      // Update pet status only. Product stock is reduced once by createOrder in the backend.
      for (const cartItem of cart) {
        if (cartItem.type === 'pet') {
          try {
            await updatePet(cartItem.item.id, { status: 'booked' });
          } catch (e) {
            console.error("Failed to update pet status", e);
          }
        }
      }

      await createOrder({
        id: uniqueCode,
        user_id: user!.id,
        user_data: {
          name: formUser.name,
          email: formUser.email,
          phone: formUser.phone,
          address: formUser.address,
        },
        order_type: cart.some(i => i.type === 'pet') ? 'adoption' : 'product',
        status: 'pending',
        total_amount: total,
        delivery_method: deliveryMethod,
        delivery_fee: deliveryFee,
        payment_proof: uploadedProofUrl,
        unique_code: uniqueCode,
        items: cart.map(cartItem => ({
          item_type: cartItem.type,
          item_id: String(cartItem.item.id),
          quantity: cartItem.quantity || 1,
          price: (cartItem.item as any).price || 0,
          item_snapshot: cartItem.item
        }))
      });

      // Beritahu admin secara instan bahwa ada order baru — tidak perlu nunggu polling
      emitDataChanged('orders');

      clearCart();
      setShowCheckoutDialog(false);
      setSuccessPopup({
        open: true,
        title: 'Pesanan Berhasil!',
        message: `Pesanan ${uniqueCode} masuk waiting list`,
        actionLabel: 'Lihat Aktivitas',
        actionPath: '/aktivitas',
      });
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Gagal memproses pesanan. Coba lagi.', 'error', 'Error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const successPopupContent = (
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
  );

  const successPopupModal =
    typeof document !== 'undefined' && document.body
      ? createPortal(successPopupContent, document.body)
      : null;

  if (cart.length === 0 && !successPopup.open) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-8xl mb-6"
        >
          🛒
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-700 mb-4">Keranjang Kosong</h2>
        <p className="text-gray-600 mb-8">Belum ada item di keranjang Anda</p>
        <div className="flex flex-col gap-3 justify-center sm:flex-row sm:gap-4">
          <Button
            onClick={() => navigate('/belanja')}
            className="bg-gradient-to-r from-blue-500 to-green-500"
          >
            Belanja Sekarang
          </Button>
          <Button
            onClick={() => navigate('/adopsi')}
            className="bg-gradient-to-r from-pink-500 to-purple-500"
          >
            Lihat Hewan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {Modal}
      {successPopupModal}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 pb-2 sm:text-4xl md:text-5xl"
        >
          Keranjang Belanja
        </motion.h1>
        <p className="text-base text-gray-700 sm:text-xl">{cart.length} item dalam keranjang</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                 <div className="relative flex flex-col gap-4 sm:flex-row">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getItemImage(item.type, item.item)}
                        alt={item.item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = getFallbackItemImage(item.type); }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{item.item.name}</h3>
                          {item.type === 'product' && (
                            <>
                              <p className="text-sm text-gray-600 mt-1">
                                Rp {(item.item as any).price.toLocaleString('id-ID')}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-1">
  <button
    onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
    className="px-3 py-1 bg-gray-200 rounded"
  >
    -
  </button>

  <span>{item.quantity || 1}</span>

  <button
    onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
    className="px-3 py-1 bg-gray-200 rounded"
  >
    +
  </button>
</div>
                              <p className="font-semibold text-blue-600 mt-2">
                                Total: Rp {(((item.item as any).price* (item.quantity || 1))).toLocaleString('id-ID')}
                              </p>
                            </>
                          )}
                          {item.type === 'pet' && (
                           <p className="text-sm text-gray-600 mt-1">
  {(item.item as any).breed} • {(item.item as any).age}
</p>
                          )}
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-purple-700">Ringkasan Belanja</h2>

              <div className="space-y-3">
                {productItems.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal Produk:</span>
                      <span className="font-semibold">
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </span>
                    </div>
                  </>
                )}

                {petItems.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      {petItems.length} hewan untuk adopsi
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Akan diproses secara terpisah di checkout
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Produk:</span>
                  <span className="text-blue-600">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Belum termasuk ongkir (jika delivery)
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                size="lg"
              >
                <ShoppingBag className="mr-2" />
                Checkout
              </Button>

              <Button
                onClick={() => clearCart()}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-2" size={16} />
                Kosongkan Keranjang
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Checkout Pesanan</DialogTitle>
            <DialogDescription>
              Lengkapi informasi pengiriman dan pembayaran
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">Informasi Pembeli:</h4>
                <button
                  onClick={() => setIsEdit(!isEdit)}
                  className="text-sm text-blue-600 font-semibold"
                >
                  {isEdit ? 'Selesai' : 'Edit'}
                </button>
              </div>
              
              {!isEdit ? (
                <div className="space-y-1 text-sm">
                  <p><strong>Nama:</strong> {formUser.name}</p>
                  <p><strong>Email:</strong> {formUser.email}</p>
                  <p><strong>No. HP:</strong> {formUser.phone}</p>
                  <p><strong>Alamat:</strong> {formUser.address}</p>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="userName">Nama:</Label>
                    <Input
                      id="userName"
                      type="text"
                      value={formUser.name}
                      onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
                      className="border-blue-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email:</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={formUser.email}
                      onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                      className="border-blue-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">No. HP:</Label>
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder="Masukkan nomor HP aktif"
                      value={formUser.phone}
                      onChange={(e) => setFormUser({ ...formUser, phone: e.target.value })}
                      className="border-blue-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingAddress">Alamat Pengiriman:</Label>
                    <textarea
                      id="shippingAddress"
                      placeholder="Masukkan alamat lengkap"
                      value={formUser.address}
                      onChange={(e) => setFormUser({ ...formUser, address: e.target.value })}
                      className="w-full border border-blue-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="space-y-4">
              <div className="bg-white border border-blue-100 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">Item Checkout:</h4>
                  <span className="text-sm text-gray-600">
                    {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} item
                  </span>
                </div>

                <div className="space-y-2">
                  {cart.map((item, index) => {
                    const quantity = item.quantity || 1;
                    const price = (item.item as any).price || 0;
                    const subtotal = price * quantity;

                    return (
                      <div
                        key={`${item.type}-${item.item.id}-${index}`}
                        className="flex justify-between gap-3 text-sm border-b last:border-b-0 pb-2 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{item.item.name}</p>
                          <p className="text-gray-500">
                            {quantity} x Rp {price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <p className="font-semibold text-blue-600 whitespace-nowrap">
                          Rp {subtotal.toLocaleString('id-ID')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Label>Metode Pengiriman:</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Button
                  type="button"
                  variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('pickup')}
                  className={deliveryMethod === 'pickup' ? 'bg-blue-600' : ''}
                >
                  Ambil di Toko (Gratis)
                </Button>
                <Button
                  type="button"
                  variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('delivery')}
                  className={deliveryMethod === 'delivery' ? 'bg-blue-600' : ''}
                >
                  Kurir (Rp 50.000)
                </Button>
              </div>
              {deliveryMethod === 'delivery' && (
                <p className="text-sm text-gray-600">
                  Pengiriman hanya untuk wilayah Bandung Kota
                </p>
              )}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
              <h4 className="font-bold">Rincian Pembayaran:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal Produk:</span>
                  <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir:</span>
                  <span>Rp {(deliveryMethod === 'delivery' ? 50000 : 0).toLocaleString('id-ID')}</span>
                </div>
            <div className="flex flex-col gap-1 font-bold pt-2 border-t sm:flex-row sm:items-center sm:justify-between">
  <span className="text-lg sm:text-2xl">
    Total:
  </span>

  <span className="text-xl font-extrabold text-blue-600 sm:text-2xl">
    Rp {(calculateTotal() + (deliveryMethod === 'delivery' ? 50000 : 0)).toLocaleString('id-ID')}
  </span>
</div>
              </div>
              <div className="pt-2 border-t mt-2">
               <p className="text-lg text-center">
  Transfer ke BCA:
</p>

<p className="text-3xl font-bold text-purple-500 text-center">
  24518266
</p>

<p className="text-2xl font-bold mt-2 text-center">
  a.n. Meow my home
</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload Bukti Transfer:</Label>
             <Input
  type="file"
  accept="image/*"
  onChange={(e) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  }}
/>

{paymentProof && (
  <img
    src={URL.createObjectURL(paymentProof)}
    className="w-32 h-32 object-cover rounded mt-2"
  />
)}
            </div>

          <div className="sticky bottom-0 bg-white pt-4">
  <Button
    onClick={confirmCheckout}
    disabled={isCheckingOut}
    className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
    size="lg"
  >
    {isCheckingOut ? (
      <><Loader2 className="mr-2 animate-spin" size={18} /> Memproses Pesanan...</>
    ) : (
      <><CheckCircle className="mr-2" /> Konfirmasi Pesanan</>
    )}
  </Button>
</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
