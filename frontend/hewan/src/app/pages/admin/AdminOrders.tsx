import { useState, useEffect } from 'react';
import { Order } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, XCircle, Package, Eye, Search } from 'lucide-react';
import { useModalAlert } from '../../components/ui/modal-alert';
import { getOrders, updateOrder, uploadImage } from '../../services/api';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { getFallbackItemImage, getItemImage } from '../../utils/itemImages';

export default function AdminOrders() {
  // orders menyimpan semua pesanan dari backend.
  const [orders, setOrders] = useState<Order[]>([]);

  // searchTerm menyimpan kata kunci dari input pencarian admin.
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');

  // previewImage dipakai untuk membuka lightbox saat admin klik bukti transfer/pengiriman.
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { showAlert, showConfirm, Modal } = useModalAlert();

  // Mengambil data pesanan terbaru dari API.
  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Gagal memuat pesanan:", error);
    }
  };

  useEffect(() => {
    loadOrders();

    // Event storage membuat data ikut refresh kalau ada perubahan dari tab lain.
    const handleStorage = () => loadOrders();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Refresh otomatis setiap 6 detik saat data orders berubah.
  useLiveRefresh(loadOrders, ['orders'], 6000, []);

  // Mengubah status pesanan di backend, lalu update tampilan lokal.
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrder(orderId, { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o));
    } catch (error) {
      console.error("Gagal mengupdate status pesanan:", error);
      showAlert('Gagal mengupdate status pesanan.', 'error', 'Error');
      throw error;
    }
  };

  // Tombol konfirmasi pesanan: admin menyetujui pembayaran.
  const handleConfirmOrder = (orderId: string) => {
    showConfirm(
      'Konfirmasi pesanan ini? Pembayaran akan dianggap valid.',
      async () => { await updateOrderStatus(orderId, 'confirmed'); showAlert('Pesanan berhasil dikonfirmasi!', 'success', 'Dikonfirmasi'); },
      'Konfirmasi Pesanan?', 'Ya, Konfirmasi',
    );
  };

  // Tombol tolak pesanan: admin membatalkan pesanan.
  const handleRejectOrder = (orderId: string) => {
    showConfirm(
      'Tolak pesanan ini? Pesanan akan dibatalkan.',
      async () => { await updateOrderStatus(orderId, 'cancelled'); showAlert('Pesanan telah ditolak.', 'warning', 'Ditolak'); },
      'Tolak Pesanan?', 'Ya, Tolak',
    );
  };

  // Upload bukti saat pelanggan mengambil pesanan di toko.
  const handleUploadPickup = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadImage(file);
      await updateOrder(id, { pickup_proof: uploadedUrl, status: 'completed' });
      
      setOrders(orders.map(o => o.id === id ? { ...o, pickupProof: uploadedUrl, status: 'completed' } : o));
      showAlert('Bukti pengambilan berhasil diupload! Pesanan selesai.', 'success', 'Upload Berhasil');
    } catch (e: any) {
      console.error(e);
      showAlert(e.message || 'Gagal mengupload bukti pengambilan', 'error', 'Error');
    }
  };

  // Upload bukti saat pesanan dikirim menggunakan kurir.
  const handleUploadDelivery = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadImage(file);
      await updateOrder(id, { delivery_proof: uploadedUrl, status: 'shipped' });
      
      setOrders(orders.map(o => o.id === id ? { ...o, deliveryProof: uploadedUrl, status: 'shipped' } : o));
      showAlert('Bukti pengiriman berhasil diupload!', 'success', 'Upload Berhasil');
    } catch (e: any) {
      console.error(e);
      showAlert(e.message || 'Gagal mengupload bukti pengiriman', 'error', 'Error');
    }
  };

  const statusMap: Record<string, { label: string; color: string; keywords: string }> = {
    unpaid:     { label: 'Belum Dibayar', color: 'bg-red-500',    keywords: 'belum dibayar unpaid pembayaran nanti bayar sekarang' },
    pending:    { label: 'Menunggu',      color: 'bg-yellow-500', keywords: 'menunggu pending menunggu konfirmasi' },
    confirmed:  { label: 'Dikonfirmasi',  color: 'bg-blue-500',   keywords: 'dikonfirmasi confirmed konfirmasi' },
    processing: { label: 'Diproses',      color: 'bg-purple-500', keywords: 'diproses processing proses' },
    shipped:    { label: 'Dikirim',       color: 'bg-indigo-500', keywords: 'dikirim shipped kirim kurir' },
    ready:      { label: 'Siap Diambil',  color: 'bg-blue-400',   keywords: 'siap diambil ready ambil pickup' },
    completed:  { label: 'Selesai',       color: 'bg-green-500',  keywords: 'selesai completed selesai pesanan' },
    cancelled:  { label: 'Dibatalkan',    color: 'bg-red-500',    keywords: 'dibatalkan cancelled batal ditolak' },
  };

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    ...Object.entries(statusMap).map(([value, status]) => ({ value, label: status.label })),
  ];

  // Mengubah status mentah dari database menjadi badge warna yang mudah dibaca admin.
  const getStatusBadge = (status: string) => {
    const s = statusMap[status] ?? { label: status, color: 'bg-gray-400' };
    return <Badge className={`${s.color} text-white`}>{s.label}</Badge>;
  };

  // normalize menyamakan format teks agar pencarian tidak sensitif huruf besar/kecil.
  const normalize = (value: unknown) => String(value ?? '').toLowerCase();

  // Filter pencarian pesanan.
  // Tambahkan field baru ke array searchableText kalau ada data lain yang ingin ikut dicari.
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
      order.deliveryMethod === 'pickup' ? 'ambil di toko pickup' : 'kurir delivery',
      order.totalAmount,
      order.userData?.name,
      order.userData?.email,
      order.userData?.phone,
      order.userData?.address,
      (order as any).userName,
      itemNames,
    ].map(normalize).join(' ');

    return searchableText.includes(keyword);
  });

  const pendingOrders   = filteredOrders.filter(o => ['pending', 'unpaid'].includes(o.status));
  const activeOrders    = filteredOrders.filter(o => ['confirmed', 'processing', 'shipped', 'ready'].includes(o.status));
  const completedOrders = filteredOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  // Card untuk satu pesanan.
  // Ubah warna card dari class bg-gradient-to-br/from-white/to-blue-50.
  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="bg-gradient-to-br from-white to-blue-50">
      <CardContent className="p-6">
        {/* Header pesanan: kode, tanggal, tipe, dan status. */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-bold text-lg">Kode: {order.uniqueCode}</p>
            <p className="text-sm text-gray-600">
              {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Tipe: <strong>{order.orderType === 'adoption' ? 'Adopsi' : 'Produk'}</strong>
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* Informasi pembeli.
            Ubah posisi data dari grid-cols-1/md:grid-cols-2.
            Ubah warna box dari bg-white, border-purple-100, dan text-gray-700. */}
        <div className="bg-white p-4 rounded-lg border border-purple-100 mb-4 text-sm">
          <p className="font-semibold text-purple-700 mb-2">Informasi Pembeli</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
            <div><span className="text-gray-500 block text-xs">Nama</span> {order.userData?.name || order.userName || '-'}</div>
            <div><span className="text-gray-500 block text-xs">No. HP</span> {order.userData?.phone || '-'}</div>
            <div className="md:col-span-2"><span className="text-gray-500 block text-xs">Email</span> {order.userData?.email || '-'}</div>
            {order.userData?.address && (
              <div className="md:col-span-2"><span className="text-gray-500 block text-xs">Alamat</span> {order.userData.address}</div>
            )}
          </div>
        </div>

        {/* Daftar item yang dibeli/diadopsi dalam pesanan. */}
        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 bg-white p-3 rounded-lg">
              <div className="w-16 h-16 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                <img
                  src={getItemImage(item.type, item.item)}
                  alt={item.item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = getFallbackItemImage(item.type); }}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.item.name}</p>
                {item.type === 'product' && (
                  <p className="text-xs text-gray-600">
                    Rp {(item.item as any).price?.toLocaleString('id-ID')}
                    {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ringkasan pembayaran.
            Ubah warna background ringkasan dari bg-blue-50, total dari text-blue-600. */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="text-sm space-y-1">
            <p>Pengiriman: <strong>{order.deliveryMethod === 'pickup' ? 'Ambil di Toko' : 'Kurir'}</strong></p>
            {order.deliveryFee && order.deliveryFee > 0 ? (
              <p>Ongkir: Rp {order.deliveryFee.toLocaleString('id-ID')}</p>
            ) : null}
            <p className="text-lg font-bold text-blue-600 pt-2 border-t">
              Total: Rp {order.totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Bukti transfer. Klik gambar akan membuka preview besar/lightbox. */}
        {order.paymentProof && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">📎 Bukti Transfer:</p>
            <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
              onClick={() => setPreviewImage(order.paymentProof!)}>
              <img
                src={order.paymentProof}
                alt="Bukti Transfer"
                className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Klik gambar untuk memperbesar</p>
          </div>
        )}

        {/* Bukti pengiriman dari admin untuk pesanan kurir. */}
        {order.deliveryProof && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">🚚 Bukti Pengiriman:</p>
            <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
              onClick={() => setPreviewImage(order.deliveryProof!)}>
              <img
                src={order.deliveryProof}
                alt="Bukti Pengiriman"
                className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Bukti pengambilan untuk pesanan yang diambil langsung di toko. */}
        {order.pickupProof && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">📦 Bukti Pengambilan:</p>
            <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
              onClick={() => setPreviewImage(order.pickupProof!)}>
              <img
                src={order.pickupProof}
                alt="Bukti Pengambilan"
                className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Tombol aksi admin.
            Ubah warna tombol dari class bg-green-600/bg-purple-600/bg-blue-600. */}
        <div className="space-y-2">
          {order.status === 'unpaid' && (
            <div className="text-center py-2 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
              Menunggu pembayaran dari pelanggan.
            </div>
          )}

          {order.status === 'pending' && (
            <div className="flex gap-2">
              <Button onClick={() => handleConfirmOrder(order.id)} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                <CheckCircle size={16} className="mr-1" /> Konfirmasi
              </Button>
              <Button onClick={() => handleRejectOrder(order.id)} variant="destructive" size="sm">
                <XCircle size={16} className="mr-1" /> Tolak
              </Button>
            </div>
          )}

          {order.status === 'confirmed' && (
            <Button onClick={() => updateOrderStatus(order.id, 'processing')} className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
              <Package size={16} className="mr-1" /> Proses Pesanan
            </Button>
          )}

          {order.status === 'processing' && order.deliveryMethod === 'delivery' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Upload bukti pengiriman:</p>
              <label className="block w-full cursor-pointer">
                <div className="w-full py-2 px-4 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-600 text-sm text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                  📷 Upload Bukti Pengiriman
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadDelivery(e, order.id)} />
              </label>
            </div>
          )}

          {order.status === 'processing' && order.deliveryMethod === 'pickup' && (
            <Button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
              📦 Siap Diambil
            </Button>
          )}

          {order.status === 'ready' && order.deliveryMethod === 'pickup' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Upload bukti pengambilan:</p>
              <label className="block w-full cursor-pointer">
                <div className="w-full py-2 px-4 rounded-lg border-2 border-dashed border-green-300 text-green-600 text-sm text-center hover:border-green-500 hover:bg-green-50 transition-all">
                  📷 Upload Bukti Pengambilan
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadPickup(e, order.id)} />
              </label>
            </div>
          )}

          {order.status === 'shipped' && (
            <Button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full bg-green-600 hover:bg-green-700" size="sm">
              ✅ Selesaikan Pesanan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {Modal}

      {/* Lightbox preview gambar.
          Ubah posisi preview dari fixed inset-0 dan flex items-center justify-center.
          Ubah gelap background dari bg-black/80. */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={previewImage} alt="Preview" className="w-full rounded-2xl shadow-2xl max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
            >
              ✕
            </button>
            <p className="text-center text-white/60 text-sm mt-3">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Kelola Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search bar pesanan.
              Ubah posisi icon dari left-3/top-1/2.
              Ubah warna border input dari border-purple-200/focus:border-purple-500. */}
          <div className="grid gap-3 md:grid-cols-[1fr_220px] mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari kode pesanan, nama, email, no HP, produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500"
              />
            </div>
            <select
              aria-label="Filter status pesanan"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
              className="h-9 w-full rounded-md border border-purple-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
              <TabsTrigger value="active">Aktif ({activeOrders.length})</TabsTrigger>
              <TabsTrigger value="completed">Selesai ({completedOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingOrders.length === 0
                ? <div className="text-center py-8 text-gray-500">Tidak ada pesanan pending</div>
                : pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeOrders.length === 0
                ? <div className="text-center py-8 text-gray-500">Tidak ada pesanan aktif</div>
                : activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedOrders.length === 0
                ? <div className="text-center py-8 text-gray-500">Belum ada pesanan yang selesai</div>
                : completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
