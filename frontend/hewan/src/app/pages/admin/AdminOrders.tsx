import { useState, useRef } from 'react';
import { Order } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, XCircle, Package, Eye, Search, Loader2 } from 'lucide-react';
import { useModalAlert } from '../../components/ui/modal-alert';
import { updateOrder, uploadImage } from '../../services/api';
import { emitDataChanged } from '../../hooks/useLiveRefresh';
import { useAdminData } from '../../context/AdminDataContext';
import { getFallbackItemImage, getItemImage } from '../../utils/itemImages';

// ─── Tipe props untuk OrderCard ──────────────────────────────
interface OrderCardProps {
  order: Order;
  isLoading: boolean;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onUploadPickup: (file: File, id: string) => void;
  onUploadDelivery: (file: File, id: string) => void;
  onPreview: (url: string) => void;
}

// ─── OrderCard didefinisikan di LUAR komponen utama ──────────
// Ini penting! Kalau didefinisikan di dalam AdminOrders(), React akan
// membuat komponen baru setiap render sehingga file input di-unmount
// sebelum onChange sempat diproses.
function OrderCard({
  order,
  isLoading,
  onConfirm,
  onReject,
  onUpdateStatus,
  onUploadPickup,
  onUploadDelivery,
  onPreview,
}: OrderCardProps) {
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  const statusMap: Record<string, { label: string; color: string }> = {
    unpaid:     { label: 'Belum Dibayar', color: 'bg-red-500'    },
    pending:    { label: 'Menunggu',      color: 'bg-yellow-500' },
    confirmed:  { label: 'Dikonfirmasi',  color: 'bg-blue-500'   },
    processing: { label: 'Diproses',      color: 'bg-purple-500' },
    shipped:    { label: 'Dikirim',       color: 'bg-indigo-500' },
    ready:      { label: 'Siap Diambil',  color: 'bg-blue-400'   },
    completed:  { label: 'Selesai',       color: 'bg-green-500'  },
    cancelled:  { label: 'Dibatalkan',    color: 'bg-red-500'    },
  };

  const s = statusMap[order.status] ?? { label: order.status, color: 'bg-gray-400' };

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50">
      <CardContent className="p-6">
        {/* Header */}
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
          <Badge className={`${s.color} text-white`}>{s.label}</Badge>
        </div>

        {/* Info Pembeli */}
        <div className="bg-white p-4 rounded-lg border border-purple-100 mb-4 text-sm">
          <p className="font-semibold text-purple-700 mb-2">Informasi Pembeli</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
            <div><span className="text-gray-500 block text-xs">Nama</span> {order.userData?.name || (order as any).userName || '-'}</div>
            <div><span className="text-gray-500 block text-xs">No. HP</span> {order.userData?.phone || '-'}</div>
            <div className="md:col-span-2"><span className="text-gray-500 block text-xs">Email</span> {order.userData?.email || '-'}</div>
            {order.userData?.address && (
              <div className="md:col-span-2"><span className="text-gray-500 block text-xs">Alamat</span> {order.userData.address}</div>
            )}
          </div>
        </div>

        {/* Items */}
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

        {/* Ringkasan */}
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

        {/* Bukti Transfer */}
        {order.paymentProof && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">📎 Bukti Transfer:</p>
            <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
              onClick={() => onPreview(order.paymentProof!)}>
              <img src={order.paymentProof} alt="Bukti Transfer"
                className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Klik gambar untuk memperbesar</p>
          </div>
        )}

        {/* Bukti Pengiriman */}
        {order.deliveryProof && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">🚚 Bukti Pengiriman:</p>
            <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
              onClick={() => onPreview(order.deliveryProof!)}>
              <img src={order.deliveryProof} alt="Bukti Pengiriman"
                className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Bukti Pengambilan */}
        {order.pickupProof && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">📦 Bukti Pengambilan:</p>
            <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
              onClick={() => onPreview(order.pickupProof!)}>
              <img src={order.pickupProof} alt="Bukti Pengambilan"
                className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="space-y-2">
          {order.status === 'unpaid' && (
            <div className="text-center py-2 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
              Menunggu pembayaran dari pelanggan.
            </div>
          )}

          {order.status === 'pending' && (
            <div className="flex gap-2">
              <Button onClick={() => onConfirm(order.id)} disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                {isLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <CheckCircle size={16} className="mr-1" />}
                Konfirmasi
              </Button>
              <Button onClick={() => onReject(order.id)} disabled={isLoading}
                variant="destructive" size="sm">
                {isLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <XCircle size={16} className="mr-1" />}
                Tolak
              </Button>
            </div>
          )}

          {order.status === 'confirmed' && (
            <Button onClick={() => onUpdateStatus(order.id, 'processing')} disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
              {isLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Package size={16} className="mr-1" />}
              Proses Pesanan
            </Button>
          )}

          {/* Upload bukti pengiriman (kurir) — pakai ref agar tidak hilang saat re-render */}
          {order.status === 'processing' && order.deliveryMethod === 'delivery' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Upload bukti pengiriman:</p>
              <input
                ref={deliveryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadDelivery(file, order.id);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => deliveryInputRef.current?.click()}
                className={`w-full py-2 px-4 rounded-lg border-2 border-dashed text-sm text-center transition-all
                  ${isLoading
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer'}`}
              >
                {isLoading
                  ? <span className="flex items-center justify-center gap-1"><Loader2 size={14} className="animate-spin" /> Mengupload...</span>
                  : '📷 Upload Bukti Pengiriman'}
              </button>
            </div>
          )}

          {order.status === 'processing' && order.deliveryMethod === 'pickup' && (
            <Button onClick={() => onUpdateStatus(order.id, 'ready')} disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
              {isLoading ? <><Loader2 size={16} className="mr-1 animate-spin" /> Memproses...</> : '📦 Siap Diambil'}
            </Button>
          )}

          {/* Upload bukti pengambilan (pickup) — pakai ref agar tidak hilang saat re-render */}
          {order.status === 'ready' && order.deliveryMethod === 'pickup' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Upload bukti pengambilan:</p>
              <input
                ref={pickupInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadPickup(file, order.id);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => pickupInputRef.current?.click()}
                className={`w-full py-2 px-4 rounded-lg border-2 border-dashed text-sm text-center transition-all
                  ${isLoading
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-green-300 text-green-600 hover:border-green-500 hover:bg-green-50 cursor-pointer'}`}
              >
                {isLoading
                  ? <span className="flex items-center justify-center gap-1"><Loader2 size={14} className="animate-spin" /> Mengupload...</span>
                  : '📷 Upload Bukti Pengambilan'}
              </button>
            </div>
          )}

          {order.status === 'shipped' && (
            <Button onClick={() => onUpdateStatus(order.id, 'completed')} disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700" size="sm">
              {isLoading ? <><Loader2 size={16} className="mr-1 animate-spin" /> Memproses...</> : '✅ Selesaikan Pesanan'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Komponen Utama ───────────────────────────────────────────
export default function AdminOrders() {
  // Ambil data dari shared cache — tidak fetch ulang saat pindah tab
  const { orders, setOrders, loadingOrders } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [loadingOrderIds, setLoadingOrderIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const addLoading = (id: string) =>
    setLoadingOrderIds(prev => new Set(prev).add(id));
  const removeLoading = (id: string) =>
    setLoadingOrderIds(prev => { const s = new Set(prev); s.delete(id); return s; });

  // Tidak perlu loadOrders/useEffect/useLiveRefresh — data datang dari AdminDataContext

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    addLoading(orderId);
    try {
      await updateOrder(orderId, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o));
      emitDataChanged('orders');
    } catch {
      showAlert('Gagal mengupdate status pesanan.', 'error', 'Error');
    } finally {
      removeLoading(orderId);
    }
  };

  const handleConfirmOrder = (orderId: string) => {
    showConfirm(
      'Konfirmasi pesanan ini? Pembayaran akan dianggap valid.',
      async () => {
        await updateOrderStatus(orderId, 'confirmed');
        showAlert('Pesanan berhasil dikonfirmasi!', 'success', 'Dikonfirmasi');
      },
      'Konfirmasi Pesanan?', 'Ya, Konfirmasi',
    );
  };

  const handleRejectOrder = (orderId: string) => {
    showConfirm(
      'Tolak pesanan ini? Pesanan akan dibatalkan.',
      async () => {
        await updateOrderStatus(orderId, 'cancelled');
        showAlert('Pesanan telah ditolak.', 'warning', 'Ditolak');
      },
      'Tolak Pesanan?', 'Ya, Tolak',
    );
  };

  const handleUploadPickup = async (file: File, id: string) => {
    addLoading(id);
    try {
      const uploadedUrl = await uploadImage(file);
      await updateOrder(id, { pickup_proof: uploadedUrl, status: 'completed' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, pickupProof: uploadedUrl, status: 'completed' } : o));
      emitDataChanged('orders');
      showAlert('Bukti pengambilan berhasil diupload! Pesanan selesai.', 'success', 'Upload Berhasil');
    } catch (e: any) {
      showAlert(e.message || 'Gagal mengupload bukti pengambilan', 'error', 'Error');
    } finally {
      removeLoading(id);
    }
  };

  const handleUploadDelivery = async (file: File, id: string) => {
    addLoading(id);
    try {
      const uploadedUrl = await uploadImage(file);
      await updateOrder(id, { delivery_proof: uploadedUrl, status: 'shipped' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, deliveryProof: uploadedUrl, status: 'shipped' } : o));
      emitDataChanged('orders');
      showAlert('Bukti pengiriman berhasil diupload!', 'success', 'Upload Berhasil');
    } catch (e: any) {
      showAlert(e.message || 'Gagal mengupload bukti pengiriman', 'error', 'Error');
    } finally {
      removeLoading(id);
    }
  };

  const statusMap: Record<string, { label: string; keywords: string }> = {
    unpaid:     { label: 'Belum Dibayar', keywords: 'belum dibayar unpaid pembayaran nanti bayar sekarang' },
    pending:    { label: 'Menunggu',      keywords: 'menunggu pending menunggu konfirmasi' },
    confirmed:  { label: 'Dikonfirmasi',  keywords: 'dikonfirmasi confirmed konfirmasi' },
    processing: { label: 'Diproses',      keywords: 'diproses processing proses' },
    shipped:    { label: 'Dikirim',       keywords: 'dikirim shipped kirim kurir' },
    ready:      { label: 'Siap Diambil',  keywords: 'siap diambil ready ambil pickup' },
    completed:  { label: 'Selesai',       keywords: 'selesai completed selesai pesanan' },
    cancelled:  { label: 'Dibatalkan',    keywords: 'dibatalkan cancelled batal ditolak' },
  };

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    ...Object.entries(statusMap).map(([value, s]) => ({ value, label: s.label })),
  ];

  const normalize = (value: unknown) => String(value ?? '').toLowerCase();

  const filteredOrders = orders.filter(order => {
    const keyword = searchTerm.trim().toLowerCase();
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (!keyword) return true;
    const info = statusMap[order.status] ?? { label: order.status, keywords: order.status };
    const itemNames = order.items.map(item => normalize((item.item as any)?.name)).join(' ');
    return [
      order.id, order.uniqueCode,
      order.orderType === 'adoption' ? 'adopsi' : 'produk',
      order.status, info.label, info.keywords,
      order.deliveryMethod === 'pickup' ? 'ambil di toko pickup' : 'kurir delivery',
      order.totalAmount, order.userData?.name, order.userData?.email,
      order.userData?.phone, order.userData?.address,
      (order as any).userName, itemNames,
    ].map(normalize).join(' ').includes(keyword);
  });

  const pendingOrders   = filteredOrders.filter(o => ['pending', 'unpaid'].includes(o.status));
  const activeOrders    = filteredOrders.filter(o => ['confirmed', 'processing', 'shipped', 'ready'].includes(o.status));
  const completedOrders = filteredOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const cardProps = (order: Order) => ({
    order,
    isLoading: loadingOrderIds.has(order.id),
    onConfirm: handleConfirmOrder,
    onReject: handleRejectOrder,
    onUpdateStatus: updateOrderStatus,
    onUploadPickup: handleUploadPickup,
    onUploadDelivery: handleUploadDelivery,
    onPreview: setPreviewImage,
  });

  // Tampilkan skeleton saat data pertama kali dimuat
  if (loadingOrders && orders.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 h-48 border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Modal}

      {/* Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl w-full">
            <img src={previewImage} alt="Preview" className="w-full rounded-2xl shadow-2xl max-h-[85vh] object-contain" />
            <button onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all">
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
                : pendingOrders.map(order => <OrderCard key={order.id} {...cardProps(order)} />)}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeOrders.length === 0
                ? <div className="text-center py-8 text-gray-500">Tidak ada pesanan aktif</div>
                : activeOrders.map(order => <OrderCard key={order.id} {...cardProps(order)} />)}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedOrders.length === 0
                ? <div className="text-center py-8 text-gray-500">Belum ada pesanan yang selesai</div>
                : completedOrders.map(order => <OrderCard key={order.id} {...cardProps(order)} />)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
