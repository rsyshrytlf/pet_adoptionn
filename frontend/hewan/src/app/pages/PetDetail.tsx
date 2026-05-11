import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/useCart';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { MessageCircle, ShoppingCart, Calendar, Heart, CheckCircle, Loader2 } from 'lucide-react';
import { getPetById, updatePet, createOrder, uploadImage } from '../services/api';
import { useModalAlert } from '../components/ui/modal-alert';
import { useLiveRefresh } from '../hooks/useLiveRefresh';

// API data from DB uses snake_case
interface ApiPet {
  id: number;
  name: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  description: string;
  personality: string;
  favorite_food: string;
  favorite_toy: string;
  health: string;
  rescue_story: string;
  suitable_for: string;
  images: string[];
  status: string;
  price: number;
}

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const [pet, setPet] = useState<ApiPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  // Booking payment
  const [bookingPaymentProof, setBookingPaymentProof] = useState<string>('');
  const [bookingDelivery, setBookingDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [isEdit, setIsEdit] = useState(false);
  const [adoptingLoading, setAdoptingLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [formUser, setFormUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

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

  const fetchPet = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const data = await getPetById(id);
      // normalize images field
      if (typeof data.images === 'string') {
        try { data.images = JSON.parse(data.images); } catch { data.images = [data.images]; }
      }
      if (!Array.isArray(data.images) || data.images.length === 0) {
        data.images = ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'];
      }
      setPet(data);
    } catch {
      showAlert('Hewan tidak ditemukan atau server tidak tersedia.', 'error', 'Error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [id]);
  useLiveRefresh(() => fetchPet(true), ['pets'], 7000, [id]);

  useEffect(() => {
    if (location.state?.autoAdopt && !loading && pet) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (pet.status === 'available') {
        setShowAdoptDialog(true);
      }
      // Bersihkan state agar dialog tidak terbuka lagi saat direfresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, loading, pet, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={48} />
        <p className="text-gray-500">Memuat detail hewan...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😿</div>
        <p className="text-xl text-gray-600">Hewan tidak ditemukan</p>
        <Button onClick={() => navigate('/adopsi')} className="mt-4 bg-purple-500">
          Kembali ke Adopsi
        </Button>
      </div>
    );
  }

  const images = Array.isArray(pet.images) ? pet.images : [];

  const handleChatAdmin = () => {
    const msg = `Halo, saya tertarik dengan ${pet.name} (${pet.type} - ${pet.breed}). Bisakah saya mendapat informasi lebih lanjut?`;
    window.open(`https://wa.me/6288801874579?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    addToCart({
      type: 'pet',
      item: {
        id: String(pet.id),
        name: pet.name,
        type: pet.type as any,
        breed: pet.breed,
        gender: pet.gender as any,
        age: pet.age,
        description: pet.description,
        personality: pet.personality,
        favoriteFood: pet.favorite_food,
        favoriteToy: pet.favorite_toy,
        health: pet.health,
        rescueStory: pet.rescue_story,
        suitableFor: pet.suitable_for,
        images: images,
        status: pet.status as any,
        price: pet.price,
      }
    });
    showAlert(`${pet.name} berhasil ditambahkan ke keranjang!`, 'success', 'Ditambahkan');
  };

  const handleBooking = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setBookingPaymentProof('');
    setBookingDelivery('pickup');
    setShowBookingDialog(true);
  };

  const handleBookingProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBookingPaymentProof(reader.result as string);
    reader.readAsDataURL(file);
  };

  const confirmBooking = async () => {
    let petWasBooked = false;
    setBookingLoading(true);
    try {
      await updatePet(pet.id, { status: 'booked' });
      petWasBooked = true;

      const uniqueCode = 'BKG' + Date.now().toString().slice(-8);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const deliveryFee = bookingDelivery === 'delivery' ? 50000 : 0;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      await createOrder({
        id: uniqueCode,
        user_id: currentUser.id,
        user_data: {
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: currentUser.address || '',
        },
        order_type: 'adoption',
        status: 'unpaid',
        total_amount: (pet.price ?? 0) + deliveryFee,
        delivery_method: bookingDelivery,
        delivery_fee: deliveryFee,
        payment_proof: null,
        unique_code: uniqueCode,
        expires_at: expiresAt,
        items: [{
          item_type: 'pet',
          item_id: String(pet.id),
          quantity: 1,
          price: pet.price ?? 0,
          item_snapshot: {
            id: String(pet.id),
            name: pet.name,
            type: pet.type,
            breed: pet.breed,
            images: images,
            status: 'booked',
            price: pet.price,
          }
        }]
      });

      setShowBookingDialog(false);
      showAlert(
        `Booking ${pet.name} berhasil! Silakan lakukan pembayaran di halaman Aktivitas dalam waktu 24 jam.`,
        'success',
        'Booking Berhasil 🎉'
      );
      setTimeout(() => navigate('/aktivitas'), 1800);
    } catch (err: any) {
      console.error(err);
      if (petWasBooked && pet?.id) {
        updatePet(pet.id, { status: 'available' }).catch(console.error);
      }
      showAlert(err.message || 'Gagal melakukan booking. Coba lagi.', 'error', 'Error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAdoptNow = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setShowAdoptDialog(true);
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentProofFile(file);
    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => { setPaymentProof(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const confirmAdoption = async () => {
    if (!paymentProofFile) {
      showAlert('Mohon upload bukti transfer terlebih dahulu.', 'warning', 'Belum Lengkap');
      return;
    }

    setAdoptingLoading(true);
    try {
      await updatePet(pet.id, { status: 'booked' });
    } catch (e) {
      console.error("Gagal mengupdate status hewan", e);
    }

    try {
      const uploadedProofUrl = await uploadImage(paymentProofFile);

      const uniqueCode = 'MPH' + Date.now().toString().slice(-8);
      const deliveryFee = deliveryMethod === 'delivery' ? 50000 : 0;
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

      await createOrder({
        id: uniqueCode,
        user_id: currentUser.id,
        user_data: isEdit ? formUser : {
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: currentUser.address || '',
        },
        order_type: 'adoption',
        status: 'pending',
        total_amount: (pet.price ?? 0) + deliveryFee,
        delivery_method: deliveryMethod,
        delivery_fee: deliveryFee,
        payment_proof: uploadedProofUrl,
        unique_code: uniqueCode,
        items: [{
          item_type: 'pet',
          item_id: String(pet.id),
          quantity: 1,
          price: pet.price ?? 0,
          item_snapshot: {
            id: String(pet.id),
            name: pet.name,
            type: pet.type,
            breed: pet.breed,
            images: images,
            status: 'booked',
            price: pet.price,
          }
        }]
      });

      setShowAdoptDialog(false);
      showAlert(`Pesanan adopsi berhasil! Kode pesanan: ${uniqueCode}. Menunggu konfirmasi admin.`, 'success', 'Adopsi Berhasil 🎉');
      setTimeout(() => navigate('/aktivitas'), 1800);
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Gagal melakukan adopsi. Coba lagi.', 'error', 'Error');
    } finally {
      setAdoptingLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (pet.status === 'booked') return <Badge className="bg-yellow-500 text-lg px-4 py-2">Dipesan</Badge>;
    if (pet.status === 'adopted') return <Badge className="bg-gray-500 text-lg px-4 py-2">Diadopsi</Badge>;
    return <Badge className="bg-green-500 text-lg px-4 py-2">Tersedia</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {Modal}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Foto */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-96 rounded-2xl overflow-hidden shadow-2xl"
          >
            <img
              src={images[selectedImage]}
              alt={pet.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'; }}
            />
            <div className="absolute top-4 right-4">{getStatusBadge()}</div>
          </motion.div>

          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-4 transition ${selectedImage === idx ? 'border-purple-500' : 'border-transparent'}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-24 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-purple-700 mb-2">{pet.name}</h1>
            <p className="text-xl text-gray-600">{pet.breed}</p>
            <div className="flex gap-4 mt-4 flex-wrap">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {pet.gender === 'jantan' ? '♂️ Jantan' : '♀️ Betina'}
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2">{pet.age}</Badge>
              <Badge variant="outline" className="text-lg px-4 py-2 capitalize">{pet.type}</Badge>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-none">
            <CardContent className="p-6 space-y-3">
              {[
                { label: '💬 Tentang Saya', value: pet.description },
                { label: '🎭 Kepribadian', value: pet.personality },
                { label: '🍽️ Makanan Favorit', value: pet.favorite_food },
                { label: '🎾 Mainan Kesukaan', value: pet.favorite_toy },
                { label: '🏥 Kesehatan', value: pet.health },
                { label: '📖 Cerita Penyelamatan', value: pet.rescue_story },
                { label: '👤 Cocok Untuk', value: pet.suitable_for },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <h3 className="font-bold text-purple-700 mb-1">{label}:</h3>
                  <p className="text-gray-700">{value}</p>
                </div>
              ) : null)}
            </CardContent>
          </Card>

          {pet.status !== 'adopted' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Button onClick={handleChatAdmin} variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                <MessageCircle className="mr-2" size={18} /> Chat Admin
              </Button>
              <Button onClick={handleAddToCart} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                <ShoppingCart className="mr-2" size={18} /> Keranjang
              </Button>
              <Button
                onClick={handleBooking}
                variant="outline"
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                disabled={pet.status === 'booked'}
              >
                <Calendar className="mr-2" size={18} />
                {pet.status === 'booked' ? 'Sudah Dipesan' : 'Booking'}
              </Button>
              <Button
                onClick={handleAdoptNow}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                disabled={pet.status === 'booked'}
              >
                <Heart className="mr-2" size={18} /> Adopsi Sekarang
              </Button>
            </div>
          )}

          {pet.status === 'adopted' && (
            <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500">
              <p className="text-lg font-semibold">Hewan ini sudah diadopsi 💜</p>
              <Button onClick={() => navigate('/adopsi')} className="mt-3 bg-purple-500">Lihat Hewan Lain</Button>
            </div>
          )}
        </div>
      </div>

      {/* ===== DIALOG ADOPSI ===== */}
      <Dialog open={showAdoptDialog} onOpenChange={setShowAdoptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Adopsi {pet.name}</DialogTitle>
            <DialogDescription>Lengkapi informasi berikut untuk mengadopsi {pet.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Info User */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">Informasi Anda:</h4>
                <button
                  onClick={() => { if (isEdit) setIsEdit(false); else setIsEdit(true); }}
                  className="text-sm text-purple-600 font-semibold"
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
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="userName">Nama:</Label>
                    <Input
                      id="userName"
                      type="text"
                      value={formUser.name}
                      onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email:</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={formUser.email}
                      onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                    />
                  </div>
                  <div><Label>No. HP</Label><Input value={formUser.phone} onChange={e => setFormUser({ ...formUser, phone: e.target.value })} /></div>
                  <div><Label>Alamat Lengkap</Label><textarea value={formUser.address} onChange={e => setFormUser({ ...formUser, address: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" rows={3} /></div>
                </div>
              )}
            </div>

            {/* Metode Pengambilan */}
            <div className="space-y-3">
              <Label>Metode Pengambilan:</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Button type="button" variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('pickup')}
                  className={deliveryMethod === 'pickup' ? 'bg-purple-600' : ''}
                >🏠 Ambil ke Shelter (Gratis)</Button>
                <Button type="button" variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('delivery')}
                  className={deliveryMethod === 'delivery' ? 'bg-purple-600' : ''}
                >🚚 Kurir (Rp 50.000)</Button>
              </div>
              {deliveryMethod === 'delivery' && (
                <p className="text-sm text-gray-500">Layanan kurir khusus untuk wilayah Bandung Kota</p>
              )}
            </div>

            {/* Info Pembayaran */}
            <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
              <h4 className="font-bold">Informasi Pembayaran:</h4>
              <p className="text-lg text-left">
  Transfer ke BCA
</p>

<p className="text-[21px] font-bold text-purple-600 text-left">
  24518266
</p>

<p className="text-[19px] font-bold text-black-600 text-left">
  a.n. Meow my home
</p>
              <p className="text-sm">Harga Hewan: <strong>Rp {(pet.price ?? 0).toLocaleString('id-ID')}</strong></p>
              <p className="text-sm">Ongkir: <strong>Rp {deliveryMethod === 'delivery' ? '50.000' : '0'}</strong></p>
              <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
                <p className="text-sm opacity-90">Total Pembayaran</p>
                <p className="text-2xl font-bold">
                  Rp {((pet.price ?? 0) + (deliveryMethod === 'delivery' ? 50000 : 0)).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Upload Bukti Transfer */}
            <div className="space-y-2">
              <Label>Upload Bukti Transfer:</Label>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-all">
                  {paymentProof ? (
                    <img src={paymentProof} alt="Bukti" className="max-h-40 rounded-lg object-contain" />
                  ) : (
                    <>
                      <div className="text-4xl">📎</div>
                      <p className="text-sm text-purple-600 font-medium">Klik untuk upload bukti transfer</p>
                      <p className="text-xs text-gray-400">JPG, PNG maks. 5MB</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePaymentProofChange} />
              </label>
              {paymentProof && (
                <button onClick={() => { setPaymentProof(''); setPaymentProofFile(null); }} className="text-xs text-red-500 hover:underline">
                  Hapus bukti
                </button>
              )}
            </div>

            <Button
              onClick={confirmAdoption}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
              size="lg"
              disabled={adoptingLoading}
            >
              {adoptingLoading ? (
                <><Loader2 className="mr-2 animate-spin" size={18} /> Memproses...</>
              ) : (
                <><CheckCircle className="mr-2" /> Konfirmasi Adopsi</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG BOOKING ===== */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Booking {pet.name}</DialogTitle>
            <DialogDescription>
              Booking berlaku 24 jam. Pembayaran dilakukan nanti melalui menu Aktivitas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-700">
              ⏰ Setelah booking dikonfirmasi, <strong>{pet.name}</strong> akan disembunyikan dari user lain. Anda memiliki waktu <strong>24 jam</strong> untuk melakukan pembayaran di menu Aktivitas.
            </div>

            {/* Metode Pengambilan */}
            <div className="space-y-2">
              <Label>Metode Pengambilan:</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button type="button"
                  variant={bookingDelivery === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setBookingDelivery('pickup')}
                  className={bookingDelivery === 'pickup' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >🏠 Ambil ke Shelter</Button>
                <Button type="button"
                  variant={bookingDelivery === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setBookingDelivery('delivery')}
                  className={bookingDelivery === 'delivery' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >🚚 Kurir (+Rp 50.000)</Button>
              </div>
            </div>

            {/* Rincian Harga */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-gray-800">🛒 Rincian Biaya:</h4>
              <div className="pt-2 space-y-1">
                <p className="text-sm">Harga: <strong>Rp {(pet.price ?? 0).toLocaleString('id-ID')}</strong></p>
                <p className="text-sm">Ongkir: <strong>Rp {bookingDelivery === 'delivery' ? '50.000' : '0'}</strong></p>
              </div>
              <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <p className="text-xs opacity-80">Total yang Harus Dibayar Nanti</p>
                <p className="text-xl font-bold">
                  Rp {((pet.price ?? 0) + (bookingDelivery === 'delivery' ? 50000 : 0)).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <Button
              onClick={confirmBooking}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              size="lg"
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <><Loader2 className="mr-2 animate-spin" size={18} /> Memproses...</>
              ) : (
                <><CheckCircle className="mr-2" size={18} /> Konfirmasi Booking</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
