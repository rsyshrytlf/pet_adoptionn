import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Reservation as ReservationType } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Package, Calendar, Clock, CheckCircle, XCircle, Truck, Star, X, ImagePlus, Loader2, Upload, Search } from 'lucide-react';
import { useModalAlert } from '../components/ui/modal-alert';
import { updatePet, getOrders, updateOrder, uploadImage } from '../services/api';
import { useLiveRefresh, emitDataChanged } from '../hooks/useLiveRefresh';
import { getFallbackItemImage, getItemImage } from '../utils/itemImages';

export default function Activity() {
  const { user } = useAuth();
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Review State
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Payment State
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Countdown Timer State: { orderId -> remaining ms }
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref to read latest orders inside interval without re-creating it
  const ordersRef = useRef<Order[]>([]);

  const fetchActivity = async () => {
    if (user) {
      try {
        const userOrders = await getOrders(user.id);
        
        // AUTO CANCELLATION LOGIC
        const now = Date.now();
        const activeOrders = await Promise.all(userOrders.map(async (o: Order) => {
          if (o.status === 'unpaid' && o.expiresAt && now > o.expiresAt) {
            await updateOrder(o.id, { status: 'cancelled' });
            return { ...o, status: 'cancelled' as const };
          }
          return o;
        }));
        
        ordersRef.current = activeOrders;
        setOrders(activeOrders);

        const allReservations = await import('../services/api').then(m => m.getReservations());
        const userReservations = allReservations
          .filter((r: ReservationType) => r.userId === user.id)
          .sort((a: ReservationType, b: ReservationType) =>
            (b.createdAt || 0) - (a.createdAt || 0)
          );
        setReservations(userReservations);
      } catch (error) {
        console.error("Gagal mengambil aktivitas:", error);
      }
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [user]);
  useLiveRefresh(fetchActivity, ['orders', 'reservations'], 6000, [user?.id]);

  // ── Countdown Timer ──────────────────────────────────────────
  // Reads expires_at from DB (via ordersRef) — persists across logout/refresh
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const tick = () => {
      const now = Date.now();
      const current = ordersRef.current;
      const next: Record<string, number> = {};
      let hasExpired = false;

      current.forEach(o => {
        if (o.status === 'unpaid' && o.expiresAt) {
          const remaining = Number(o.expiresAt) - now;
          if (remaining <= 0) {
            hasExpired = true;
            next[o.id] = 0;
          } else {
            next[o.id] = remaining;
          }
        }
      });

      setCountdowns(next);

      // Auto-cancel expired orders in state + DB
      if (hasExpired) {
        setOrders(prev => {
          const updated = prev.map(o => {
            if (o.status === 'unpaid' && o.expiresAt && Date.now() > Number(o.expiresAt)) {
              updateOrder(o.id, { status: 'cancelled' }).catch(console.error);
              if (o.items && o.items[0]?.type === 'pet' && (o.items[0].item as any)?.id) {
                updatePet((o.items[0].item as any).id, { status: 'available' }).catch(console.error);
              }
              return { ...o, status: 'cancelled' as const };
            }
            return o;
          });
          ordersRef.current = updated;
          return updated;
        });
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orders.length]);

  // Format ms -> HH:MM:SS
  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [
      String(h).padStart(2, '0'),
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ].join(':');
  }, []);

  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode; keywords: string }> = {
    unpaid:     { label: 'Belum Dibayar', color: 'bg-red-500',    icon: <Clock size={12} className="mr-1" />,       keywords: 'belum dibayar unpaid bayar pembayaran' },
    pending:    { label: 'Menunggu',      color: 'bg-yellow-500', icon: <Clock size={12} className="mr-1" />,       keywords: 'menunggu pending konfirmasi' },
    confirmed:  { label: 'Dikonfirmasi',  color: 'bg-blue-500',   icon: <CheckCircle size={12} className="mr-1" />, keywords: 'dikonfirmasi confirmed konfirmasi' },
    processing: { label: 'Diproses',      color: 'bg-purple-500', icon: <Package size={12} className="mr-1" />,     keywords: 'diproses processing proses' },
    shipped:    { label: 'Dikirim',       color: 'bg-indigo-500', icon: <Truck size={12} className="mr-1" />,       keywords: 'dikirim shipped kirim kurir' },
    ready:      { label: 'Siap Diambil',  color: 'bg-cyan-500',   icon: <Package size={12} className="mr-1" />,     keywords: 'siap diambil ready ambil pickup' },
    completed:  { label: 'Selesai',       color: 'bg-green-500',  icon: <CheckCircle size={12} className="mr-1" />, keywords: 'selesai completed selesai pesanan' },
    cancelled:  { label: 'Dibatalkan',    color: 'bg-red-500',    icon: <XCircle size={12} className="mr-1" />,     keywords: 'dibatalkan cancelled batal' },
  };

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    ...Object.entries(statusMap).map(([value, status]) => ({ value, label: status.label })),
  ];

  const getStatusBadge = (status: string) => {
    const s = statusMap[status] ?? { label: status, color: 'bg-gray-400', icon: null };
    return (
      <Badge className={`${s.color} text-white flex items-center`}>
        {s.icon}{s.label}
      </Badge>
    );
  };

  const normalize = (value: unknown) => String(value ?? '').toLowerCase();

  const filteredOrders = orders.filter(order => {
    const keyword = searchTerm.trim().toLowerCase();
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (!keyword) return true;

    const itemNames = order.items
      .map(item => normalize((item.item as any)?.name))
      .join(' ');
    const statusInfo = statusMap[order.status] ?? { label: order.status, keywords: order.status };

    const searchableText = [
      order.id,
      order.uniqueCode,
      order.orderType === 'adoption' ? 'adopsi' : 'produk',
      order.status,
      statusInfo.label,
      statusInfo.keywords,
      order.deliveryMethod === 'pickup' ? 'ambil toko pickup' : 'kurir delivery',
      order.totalAmount,
      itemNames,
      format(new Date(order.createdAt), 'dd MMMM yyyy HH:mm', { locale: idLocale }),
    ].map(normalize).join(' ');

    return searchableText.includes(keyword);
  });

  const filteredReservations = reservations.filter(reservation => {
    const keyword = searchTerm.trim().toLowerCase();
    if (statusFilter !== 'all' && reservation.status !== statusFilter) return false;
    if (!keyword) return true;
    const statusInfo = statusMap[reservation.status] ?? { label: reservation.status, keywords: reservation.status };

    const searchableText = [
      reservation.id,
      reservation.type === 'shelter' ? 'kunjungan shelter' : 'grooming',
      reservation.status,
      statusInfo.label,
      statusInfo.keywords,
      reservation.time,
      reservation.adminFee,
      reservation.groomingPackage?.name,
      reservation.groomingPackage?.price,
      format(new Date(reservation.date), 'dd MMMM yyyy', { locale: idLocale }),
    ].map(normalize).join(' ');

    return searchableText.includes(keyword);
  });

  const handleUserConfirm = (id: string) => {
    showConfirm(
      'Konfirmasi bahwa pesanan sudah diterima/diambil?',
      async () => {
        try {
          await updateOrder(id, { status: 'completed' });
          setOrders(orders.map(o => o.id === id ? { ...o, status: 'completed' } : o));
          setReviewOrderId(id);
          setRating(5);
          setComment('');
          setReviewImagePreview('');
          setReviewImageFile(null);
        } catch (e) {
          console.error(e);
          showAlert('Gagal mengkonfirmasi pesanan', 'error', 'Error');
        }
      },
      'Pesanan Diterima?',
      'Ya, Sudah Diterima',
    );
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReviewImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setReviewImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitReview = async () => {
    const wordCount = comment.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 120) {
      showAlert('Maksimal 120 kata ya!', 'warning', 'Terlalu Panjang');
      return;
    }
    if (!comment.trim()) {
      showAlert('Tulis dulu ulasan kamu ya!', 'warning', 'Ulasan Kosong');
      return;
    }

    setSubmittingReview(true);
    try {
      let uploadedImageUrl = null;
      if (reviewImageFile) {
        uploadedImageUrl = await uploadImage(reviewImageFile);
      }
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const reviewData = {
        rating,
        comment,
        image: uploadedImageUrl,
        approved: false, // menunggu persetujuan admin
        userName: currentUser.name || user?.name || 'User',
        createdAt: new Date().toISOString(),
      };
      
      await updateOrder(reviewOrderId!, { review: reviewData });
      
      setOrders(orders.map(o => o.id === reviewOrderId ? { ...o, review: reviewData } : o));

      // Beritahu admin segera bahwa ada review baru — tidak perlu nunggu polling
      emitDataChanged('reviews');
      emitDataChanged('orders');

      setSubmittingReview(false);
      setReviewOrderId(null);
      setComment('');
      setReviewImagePreview('');
      setReviewImageFile(null);
      setRating(5);
      showAlert(
        'Ulasan berhasil dikirim! Sedang menunggu persetujuan admin. Jika disetujui, ulasan akan ditampilkan di beranda. 🙏',
        'success',
        'Review Terkirim'
      );
    } catch (e: any) {
      console.error(e);
      setSubmittingReview(false);
      showAlert(e.message || 'Gagal mengirim ulasan', 'error', 'Error');
    }
  };

  const handlePaymentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPaymentProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitPayment = async () => {
    if (!paymentProofFile) {
      showAlert('Silakan upload bukti transfer terlebih dahulu!', 'warning', 'Belum Lengkap');
      return;
    }

    setSubmittingPayment(true);
    try {
      const uploadedProofUrl = await uploadImage(paymentProofFile);
      await updateOrder(payOrderId!, { status: 'pending', payment_proof: uploadedProofUrl });

      setOrders(orders.map(o => o.id === payOrderId ? { ...o, status: 'pending', paymentProof: uploadedProofUrl } : o));

      setPayOrderId(null);
      setPaymentProofFile(null);
      setPaymentProofPreview('');
      showAlert('Pembayaran berhasil diunggah! Menunggu konfirmasi admin.', 'success', 'Berhasil');
    } catch (e: any) {
      console.error(e);
      showAlert(e.message || 'Gagal mengunggah pembayaran', 'error', 'Error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCancelBooking = (orderId: string, petId: string) => {
    showConfirm(
      'Yakin ingin membatalkan booking ini? Hewan akan kembali tersedia untuk orang lain.',
      async () => {
        try {
          await updateOrder(orderId, { status: 'cancelled' });
          if (petId) {
            await updatePet(petId, { status: 'available' });
          }
          setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
          showAlert('Booking berhasil dibatalkan.', 'success', 'Dibatalkan');
        } catch (e) {
          console.error("Gagal membatalkan booking", e);
          showAlert('Gagal membatalkan booking.', 'error', 'Error');
        }
      },
      'Batalkan Booking?',
      'Ya, Batalkan'
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {Modal}

      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 pb-2 sm:text-4xl md:text-5xl"
        >
          Aktivitas Saya
        </motion.h1>
        <p className="text-base text-gray-700 sm:text-xl">Lihat semua pesanan dan reservasi Anda</p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Cari kode, pesanan, reservasi, tanggal, paket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 rounded-2xl border-purple-200 bg-white/80 focus:border-purple-500 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-12 w-full rounded-2xl border border-purple-200 bg-white/80 px-4 text-sm text-gray-700 shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="orders" className="text-sm sm:text-lg">
            <Package className="mr-2" size={20} /> Pesanan ({filteredOrders.length})
          </TabsTrigger>
          <TabsTrigger value="reservations" className="text-sm sm:text-lg">
            <Calendar className="mr-2" size={20} /> Reservasi ({filteredReservations.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== PESANAN ===== */}
        <TabsContent value="orders" className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl text-gray-600">
                {searchTerm ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {order.orderType === 'adoption' ? '🐾' : order.orderType === 'product' ? '🛍️' : '📦'}
                        </span>
                        <div>
                          <p className="font-bold text-lg">Kode: {order.uniqueCode}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-gray-50 p-3 rounded-xl sm:gap-4 sm:p-4">
                          <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 sm:h-20 sm:w-20">
                            <img
                              src={getItemImage(item.type, item.item)}
                              alt={item.item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = getFallbackItemImage(item.type); }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{item.item.name}</h4>
                            {item.type === 'product' && (
                              <>
                                <p className="text-sm text-gray-600">Rp {Number((item.item as any).price || 0).toLocaleString('id-ID')}</p>
                                <p className="text-sm font-semibold text-blue-600">
                                  Subtotal: Rp {((item.item as any).price * (item.quantity || 1)).toLocaleString('id-ID')}
                                </p>
                              </>
                            )}
                            {item.type === 'pet' && (
                              <p className="text-sm text-gray-600">
                                {(item.item as any).breed} • {(item.item as any).age}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Pengiriman: <span className="font-semibold">
                          {order.deliveryMethod === 'pickup' ? 'Ambil di Toko' : 'Kurir'}
                        </span></p>
                        {order.deliveryFee && order.deliveryFee > 0 && (
                          <p>Ongkir: Rp {order.deliveryFee.toLocaleString('id-ID')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-purple-600">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="mt-3">
                      {order.status === 'unpaid' && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-red-700">⚠️ Belum Dibayar</span>
                            <span className="text-xs text-red-500">Batas waktu pembayaran</span>
                          </div>
                          {/* Realtime Countdown */}
                          {order.expiresAt ? (
                            <div className="flex items-center justify-center gap-2 my-2">
                              {(['JAM', 'MENIT', 'DETIK'] as const).map((label, i) => {
                                const parts = formatCountdown(countdowns[order.id] ?? Math.max(0, Number(order.expiresAt) - Date.now())).split(':');
                                return (
                                  <React.Fragment key={label}>
                                    {i > 0 && (
                                      <span className="text-2xl font-bold text-red-400">:</span>
                                    )}
                                    <div className="bg-red-600 text-white rounded-lg px-3 py-1 text-center min-w-[52px]">
                                      <span className="text-2xl font-bold font-mono tabular-nums">{parts[i]}</span>
                                      <p className="text-[10px] text-red-200 mt-0.5">{label}</p>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-red-600">Segera lakukan pembayaran dalam 24 jam.</p>
                          )}
                          {(countdowns[order.id] ?? 1) <= 3600000 && (countdowns[order.id] ?? 1) > 0 && (
                            <p className="text-xs text-center text-red-500 font-semibold animate-pulse mt-1">🔴 Kurang dari 1 jam! Segera bayar sekarang.</p>
                          )}
                        </div>
                      )}
                      {order.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-sm text-yellow-700">
                          ⏳ Pesanan menunggu konfirmasi pembayaran dari admin
                        </div>
                      )}
                      {order.status === 'confirmed' && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm text-blue-700">
                          ✅ Pembayaran dikonfirmasi! Pesanan sedang disiapkan
                        </div>
                      )}
                      {order.status === 'processing' && (
                        <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-sm text-purple-700">
                          Pesanan sedang dikemas. Estimasi: {order.deliveryMethod === 'delivery' ? '2-3 jam' : '30-60 menit'}
                        </div>
                      )}
                      {order.status === 'shipped' && (
                        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-sm text-indigo-700">
                          🚚 Pesanan sedang dalam pengiriman menuju alamat Anda
                        </div>
                      )}
                      {order.status === 'ready' && (
                        <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl text-sm text-cyan-700">
                          🏪 Pesanan siap diambil di toko!
                        </div>
                      )}
                      {order.status === 'completed' && !order.review && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-sm text-green-700">
                          🎉 Pesanan selesai! Terima kasih telah berbelanja di Meow my home
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-sm text-red-700">
                          ❌ Pesanan dibatalkan
                        </div>
                      )}
                    </div>

                    {/* Tombol Bayar & Batal */}
                    {order.status === 'unpaid' && (
                      <div className="flex flex-col gap-2 mt-3 sm:flex-row">
                        <Button
                          onClick={() => { setPayOrderId(order.id); setPaymentProofFile(null); setPaymentProofPreview(''); }}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          <CheckCircle className="mr-2" size={18} />
                          Bayar Sekarang
                        </Button>
                        {order.items && order.items[0]?.type === 'pet' && (
                          <Button
                            onClick={() => handleCancelBooking(order.id, (order.items[0].item as any).id)}
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <XCircle className="mr-2" size={18} />
                            Batalkan
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Tombol Konfirmasi Terima */}
                    {!order.userConfirmed && (
                      (order.deliveryMethod === 'delivery' && order.status === 'shipped') ||
                      (order.deliveryMethod === 'pickup' && order.status === 'ready')
                    ) && (
                      <Button
                        onClick={() => handleUserConfirm(order.id)}
                        className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <CheckCircle className="mr-2" size={18} />
                        {order.deliveryMethod === 'pickup' ? 'Sudah Saya Ambil' : 'Pesanan Sudah Diterima'}
                      </Button>
                    )}

                    {/* Tombol Beri Review */}
                    {order.status === 'completed' && !order.review && (
                      <Button
                        onClick={() => { setReviewOrderId(order.id); setRating(5); setComment(''); setReviewImagePreview(''); }}
                        className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        <Star className="mr-2" size={18} fill="white" />
                        Beri Ulasan
                      </Button>
                    )}

                    {/* Review sudah dikirim */}
                    {order.review && (
                      <div className="mt-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-purple-700">Ulasan Anda:</span>
                          <span className="text-yellow-400">{'★'.repeat(order.review.rating)}{'☆'.repeat(5 - order.review.rating)}</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{order.review.comment}"</p>
                        {order.review.image && (
                          <img src={order.review.image} alt="" className="mt-2 h-16 rounded object-cover" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* ===== RESERVASI ===== */}
        <TabsContent value="reservations" className="space-y-4">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-xl text-gray-600">
                {searchTerm ? 'Reservasi tidak ditemukan' : 'Belum ada reservasi'}
              </p>
            </div>
          ) : (
            filteredReservations.map((reservation, index) => (
              <motion.div key={reservation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{reservation.type === 'shelter' ? '🏠' : '✂️'}</span>
                        <div>
                          <p className="font-bold text-lg">{reservation.type === 'shelter' ? 'Kunjungan Shelter' : 'Grooming'}</p>
                          <p className="text-sm text-gray-600">ID: {reservation.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Tanggal</p>
                          <p className="font-semibold">{format(new Date(reservation.date), 'dd MMMM yyyy', { locale: idLocale })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Waktu</p>
                          <p className="font-semibold">{reservation.time}</p>
                        </div>
                      </div>
                      {reservation.groomingPackage && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-500">Paket Grooming</p>
                          <p className="font-semibold">{reservation.groomingPackage.name}</p>
                          <p className="text-blue-600 font-bold">Rp {reservation.groomingPackage.price.toLocaleString('id-ID')}</p>
                        </div>
                      )}
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-500">Admin Fee</p>
                        <p className="font-semibold">Rp {reservation.adminFee.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ===== MODAL REVIEW ===== */}
      <AnimatePresence>
        {reviewOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setReviewOrderId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Beri Ulasan</h2>
                    <p className="text-white/80 text-sm mt-1">Bagikan pengalaman berbelanja di Meow my home</p>
                  </div>
                  <button onClick={() => setReviewOrderId(null)} className="bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Rating */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-125"
                      >
                        <Star
                          size={36}
                          className={`transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                          fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 self-center text-sm text-gray-500">
                      {rating === 5 ? 'Luar biasa! 🎉' : rating === 4 ? 'Sangat baik 👍' : rating === 3 ? 'Cukup baik' : rating === 2 ? 'Kurang baik' : 'Tidak puas'}
                    </span>
                  </div>
                </div>

                {/* Komentar */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Ulasan</p>
                  <textarea
                    placeholder="Ceritakan pengalaman berbelanja di Meow my home..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-right text-gray-400 mt-1">
                    {comment.trim().split(/\s+/).filter(Boolean).length} / 120 kata
                  </p>
                </div>

                {/* Upload Foto (opsional) */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Foto (opsional)</p>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-all">
                      {reviewImagePreview ? (
                        <img src={reviewImagePreview} alt="" className="max-h-32 rounded-lg object-contain" />
                      ) : (
                        <>
                          <ImagePlus size={28} className="text-purple-300" />
                          <p className="text-sm text-purple-400">Upload foto bersama peliharaanmu</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleReviewImageChange} />
                  </label>
                  {reviewImagePreview && (
                    <button onClick={() => setReviewImagePreview('')} className="text-xs text-red-400 hover:underline mt-1">Hapus foto</button>
                  )}
                </div>

                {/* Submit */}
                <Button
                  onClick={submitReview}
                  disabled={submittingReview || !comment.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-6 text-base"
                >
                  {submittingReview ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Mengirim...</>
                  ) : (
                    <><Star className="mr-2" size={18} fill="white" /> Kirim Ulasan</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL PEMBAYARAN ===== */}
      <AnimatePresence>
        {payOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setPayOrderId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Pembayaran</h2>
                    <p className="text-white/80 text-sm mt-1">Selesaikan pembayaran untuk booking Anda</p>
                  </div>
                  <button onClick={() => setPayOrderId(null)} className="bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Info Rekening */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Transfer ke Rekening BCA:</p>
                  <p className="text-2xl font-bold text-gray-800 tracking-wider my-1">24518266</p>
                  <p className="text-sm text-gray-600 mb-3">a.n. <span className="font-semibold text-gray-800">Meow my home</span></p>
                  
                  <div className="pt-3 border-t border-yellow-200">
                    <p className="text-sm text-gray-600">Total Pembayaran:</p>
                    <p className="text-xl font-bold text-orange-600">
                      Rp {Number(orders.find(o => o.id === payOrderId)?.totalAmount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Upload Foto */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Upload Bukti Transfer</p>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-yellow-300 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-yellow-500 hover:bg-yellow-50 transition-all">
                      {paymentProofPreview ? (
                        <img src={paymentProofPreview} alt="Bukti Transfer" className="max-h-40 rounded-lg object-contain shadow-sm" />
                      ) : (
                        <>
                          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                            <Upload size={28} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-yellow-700">Klik untuk memilih file</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG maksimal 5MB</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePaymentImageChange} />
                  </label>
                  {paymentProofPreview && (
                    <button onClick={() => { setPaymentProofFile(null); setPaymentProofPreview(''); }} className="text-xs text-red-500 hover:underline mt-2 font-medium">Ganti foto</button>
                  )}
                </div>

                {/* Submit */}
                <Button
                  onClick={submitPayment}
                  disabled={!paymentProofFile || submittingPayment}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 py-6 text-base shadow-md disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <><Loader2 className="mr-2 animate-spin" size={18} /> Memproses...</>
                  ) : (
                    <><CheckCircle className="mr-2" size={18} /> Konfirmasi Pembayaran</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
