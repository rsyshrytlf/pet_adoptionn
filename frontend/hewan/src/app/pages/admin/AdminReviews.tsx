import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, XCircle, Star, Trash2, Loader2 } from 'lucide-react';
import { useModalAlert } from '../../components/ui/modal-alert';
import { updateOrder } from '../../services/api';
import { emitDataChanged } from '../../hooks/useLiveRefresh';
import { useAdminData } from '../../context/AdminDataContext';

interface ReviewItem {
  id: string;
  orderId: string;
  reviewRaw: any; // data review asli dari DB, dipakai saat approve agar tidak perlu re-fetch
  userName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  serviceType: string;
  image?: string | null;
}

// ─── ReviewCard di luar komponen utama ─────────────────────────
// Agar tidak di-remount setiap kali state (loadingIds) berubah
interface ReviewCardProps {
  review: ReviewItem;
  isPending: boolean;
  isLoading: boolean;
  onApprove: (r: ReviewItem) => void;
  onReject: (r: ReviewItem) => void;
  onDelete: (r: ReviewItem) => void;
  onPreview: (url: string) => void;
}

function ReviewCard({ review, isPending, isLoading, onApprove, onReject, onDelete, onPreview }: ReviewCardProps) {
  const serviceMap: Record<string, { label: string; color: string }> = {
    adoption: { label: 'Adopsi',   color: 'bg-pink-500'  },
    product:  { label: 'Produk',   color: 'bg-green-500' },
    grooming: { label: 'Grooming', color: 'bg-blue-500'  },
  };
  const svc = serviceMap[review.serviceType] ?? { label: review.serviceType, color: 'bg-gray-400' };

  return (
    <Card className={`border-0 shadow-lg rounded-2xl transition-all ${isPending ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 'bg-white'}`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {review.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800">{review.userName}</p>
              <p className="text-xs text-gray-400">
                {review.createdAt ? format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale }) : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${svc.color} text-white`}>{svc.label}</Badge>
            {isPending && <Badge className="bg-yellow-500 text-white">Pending</Badge>}
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={16}
              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}
              fill={star <= review.rating ? 'currentColor' : 'none'} />
          ))}
          <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
        </div>

        {/* Foto review */}
        {review.image && (
          <div className="mb-3 cursor-pointer rounded-xl overflow-hidden border border-gray-200 group"
            onClick={() => onPreview(review.image!)}>
            <img src={review.image} alt=""
              className="w-full max-h-40 object-cover group-hover:opacity-90 transition-opacity" />
            <p className="text-xs text-center text-gray-400 py-1">Klik untuk perbesar</p>
          </div>
        )}

        {/* Komentar */}
        <p className="text-sm text-gray-600 italic leading-relaxed mb-4">"{review.comment}"</p>

        {/* Tombol aksi */}
        <div className="flex gap-2 flex-wrap">
          {isPending ? (
            <>
              <Button onClick={() => onApprove(review)} disabled={isLoading}
                className="flex-1 bg-green-500 hover:bg-green-600" size="sm">
                {isLoading
                  ? <><Loader2 size={14} className="mr-1 animate-spin" /> Menyetujui...</>
                  : <><CheckCircle size={14} className="mr-1" /> Setujui &amp; Tampilkan</>}
              </Button>
              <Button onClick={() => onDelete(review)} disabled={isLoading}
                variant="destructive" size="sm">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} className="mr-1" />}
                {!isLoading && 'Hapus'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => onReject(review)} disabled={isLoading}
                variant="outline" className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50" size="sm">
                {isLoading
                  ? <><Loader2 size={14} className="mr-1 animate-spin" /> Memproses...</>
                  : <><XCircle size={14} className="mr-1" /> Cabut Persetujuan</>}
              </Button>
              <Button onClick={() => onDelete(review)} disabled={isLoading}
                variant="destructive" size="sm">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Komponen Utama ─────────────────────────────────────────────
export default function AdminReviews() {
  // Ambil orders dari shared cache — tidak fetch ulang saat pindah tab
  const { orders, setOrders } = useAdminData();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const addLoading  = (id: string) => setLoadingIds(prev => new Set(prev).add(id));
  const rmLoading   = (id: string) => setLoadingIds(prev => { const s = new Set(prev); s.delete(id); return s; });

  // Derive reviews dari orders — tidak ada fetch terpisah, data sudah ada di context
  const reviews: ReviewItem[] = useMemo(() =>
    orders
      .filter((o: any) => o.review && o.review.comment)
      .map((o: any) => ({
        id: o.id,
        orderId: o.id,
        reviewRaw: o.review,
        userName: o.review.userName || o.userData?.name || (o as any).userName || 'User',
        rating: Number(o.review.rating),
        comment: o.review.comment,
        approved: !!o.review.approved,
        createdAt: o.review.createdAt || o.createdAt,
        serviceType: o.orderType,
        image: o.review.image || null,
      })),
  [orders]);



  // Setujui review — update state context (orders) sekaligus, sehingga Review & Pesanan halaman sync
  const approveReview = async (review: ReviewItem) => {
    addLoading(review.id);
    try {
      const updatedReview = { ...review.reviewRaw, approved: true };
      await updateOrder(review.id, { review: updatedReview });
      // Update shared orders di context — ReviewCard di halaman ini akan re-derive otomatis
      setOrders(prev => prev.map(o =>
        o.id === review.id ? { ...o, review: updatedReview } as any : o
      ));
      emitDataChanged('reviews');
      showAlert('Review berhasil disetujui dan akan tampil di beranda! ✅', 'success', 'Review Disetujui');
    } catch (e) {
      console.error(e);
      showAlert('Gagal menyetujui review', 'error', 'Error');
    } finally {
      rmLoading(review.id);
    }
  };

  // Cabut persetujuan — update state lokal LANGSUNG
  const rejectReview = (review: ReviewItem) => {
    showConfirm(
      'Cabut persetujuan review ini? Review tidak akan tampil di beranda.',
      async () => {
        addLoading(review.id);
        try {
          const updatedReview = { ...review.reviewRaw, approved: false };
          await updateOrder(review.id, { review: updatedReview });
          setOrders(prev => prev.map(o =>
            o.id === review.id ? { ...o, review: updatedReview } as any : o
          ));
          emitDataChanged('reviews');
          showAlert('Persetujuan review dicabut.', 'warning', 'Dicabut');
        } catch (e) {
          console.error(e);
          showAlert('Gagal mencabut persetujuan review', 'error', 'Error');
        } finally {
          rmLoading(review.id);
        }
      },
      'Cabut Persetujuan?', 'Ya, Cabut',
    );
  };

  // Hapus review — update state lokal LANGSUNG
  const deleteReview = (review: ReviewItem) => {
    showConfirm(
      'Hapus review ini permanen? Tindakan ini tidak bisa dibatalkan.',
      async () => {
        addLoading(review.id);
        try {
          await updateOrder(review.id, { review: null });
          // Hapus dari shared orders context
          setOrders(prev => prev.map(o =>
            o.id === review.id ? { ...o, review: null } as any : o
          ));
          emitDataChanged('reviews');
          showAlert('Review berhasil dihapus.', 'success', 'Dihapus');
        } catch (e) {
          console.error(e);
          showAlert('Gagal menghapus review', 'error', 'Error');
        } finally {
          rmLoading(review.id);
        }
      },
      'Hapus Review?', 'Ya, Hapus',
    );
  };

  const pendingReviews  = reviews.filter(r => !r.approved);
  const approvedReviews = reviews.filter(r =>  r.approved);

  return (
    <div className="space-y-6">
      {Modal}

      {/* Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full">
            <img src={previewImage} alt="" className="w-full rounded-2xl shadow-2xl max-h-[80vh] object-contain" />
            <button onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all">✕</button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Kelola Review</CardTitle>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {pendingReviews.length} menunggu • {approvedReviews.length} disetujui
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pending" className="relative">
                Pending Approval
                {pendingReviews.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                    {pendingReviews.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Disetujui ({approvedReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingReviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-gray-500">Tidak ada review yang menunggu persetujuan</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {pendingReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isPending={true}
                      isLoading={loadingIds.has(review.id)}
                      onApprove={approveReview}
                      onReject={rejectReview}
                      onDelete={deleteReview}
                      onPreview={setPreviewImage}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="text-gray-500">Belum ada review yang disetujui</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {approvedReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isPending={false}
                      isLoading={loadingIds.has(review.id)}
                      onApprove={approveReview}
                      onReject={rejectReview}
                      onDelete={deleteReview}
                      onPreview={setPreviewImage}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
