import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, XCircle, Star, Trash2 } from 'lucide-react';
import { useModalAlert } from '../../components/ui/modal-alert';
import { getOrders, updateOrder } from '../../services/api';

interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  serviceType: string;
  image?: string | null;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const loadReviews = async () => {
    try {
      const orders = await getOrders();
      const allReviews: ReviewItem[] = orders
        .filter((o: any) => o.review && o.review.comment)
        .map((o: any) => ({
          id: o.id,
          userName: o.review.userName || o.userData?.name || o.userName || 'User',
          rating: Number(o.review.rating),
          comment: o.review.comment,
          approved: !!o.review.approved,
          createdAt: o.review.createdAt || o.createdAt,
          serviceType: o.orderType,
          image: o.review.image || null,
        }));
      setReviews(allReviews);
    } catch (e) {
      console.error("Gagal memuat review", e);
    }
  };

  useEffect(() => {
    loadReviews();
    // Auto-refresh setiap 10 detik untuk melihat review baru
    const interval = setInterval(loadReviews, 10000);
    return () => clearInterval(interval);
  }, []);

  const approveReview = async (reviewId: string) => {
    try {
      const orders = await getOrders();
      const order = orders.find((o: any) => o.id === reviewId);
      if (order && order.review) {
        await updateOrder(reviewId, { review: { ...order.review, approved: true } });
        loadReviews();
        showAlert('Review berhasil disetujui dan akan tampil di beranda! ✅', 'success', 'Review Disetujui');
      }
    } catch (e) {
      console.error(e);
      showAlert('Gagal menyetujui review', 'error', 'Error');
    }
  };

  const rejectReview = (reviewId: string) => {
    showConfirm(
      'Tolak review ini? Review tidak akan tampil di beranda dan user bisa review ulang.',
      async () => {
        try {
          const orders = await getOrders();
          const order = orders.find((o: any) => o.id === reviewId);
          if (order && order.review) {
            await updateOrder(reviewId, { review: { ...order.review, approved: false } });
            loadReviews();
            showAlert('Review ditolak.', 'warning', 'Ditolak');
          }
        } catch (e) {
          console.error(e);
          showAlert('Gagal menolak review', 'error', 'Error');
        }
      },
      'Tolak Review?', 'Ya, Tolak',
    );
  };

  const deleteReview = (reviewId: string) => {
    showConfirm(
      'Hapus review ini permanen? Tindakan ini tidak bisa dibatalkan.',
      async () => {
        try {
          await updateOrder(reviewId, { review: null });
          loadReviews();
          showAlert('Review berhasil dihapus.', 'success', 'Dihapus');
        } catch (e) {
          console.error(e);
          showAlert('Gagal menghapus review', 'error', 'Error');
        }
      },
      'Hapus Review?', 'Ya, Hapus',
    );
  };

  const pendingReviews = reviews.filter(r => !r.approved);
  const approvedReviews = reviews.filter(r => r.approved);

  const getServiceBadge = (type: string) => {
    const map: Record<string, { label: string; color: string }> = {
      adoption: { label: 'Adopsi', color: 'bg-pink-500' },
      product:  { label: 'Produk', color: 'bg-green-500' },
      grooming: { label: 'Grooming', color: 'bg-blue-500' },
    };
    const s = map[type] ?? { label: type, color: 'bg-gray-400' };
    return <Badge className={`${s.color} text-white`}>{s.label}</Badge>;
  };

  const ReviewCard = ({ review, isPending }: { review: ReviewItem; isPending: boolean }) => (
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
                {review.createdAt
                  ? format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })
                  : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getServiceBadge(review.serviceType)}
            {isPending && <Badge className="bg-yellow-500 text-white">Pending</Badge>}
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              size={16}
              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}
              fill={star <= review.rating ? 'currentColor' : 'none'}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
        </div>

        {/* Foto review */}
        {review.image && (
          <div
            className="mb-3 cursor-pointer rounded-xl overflow-hidden border border-gray-200 group"
            onClick={() => setPreviewImage(review.image!)}
          >
            <img
              src={review.image}
              alt=""
              className="w-full max-h-40 object-cover group-hover:opacity-90 transition-opacity"
            />
            <p className="text-xs text-center text-gray-400 py-1">Klik untuk perbesar</p>
          </div>
        )}

        {/* Komentar */}
        <p className="text-sm text-gray-600 italic leading-relaxed mb-4">"{review.comment}"</p>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {isPending ? (
            <>
              <Button
                onClick={() => approveReview(review.id)}
                className="flex-1 bg-green-500 hover:bg-green-600"
                size="sm"
              >
                <CheckCircle size={14} className="mr-1" /> Setujui & Tampilkan
              </Button>
              <Button
                onClick={() => deleteReview(review.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 size={14} className="mr-1" /> Hapus
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => rejectReview(review.id)}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                size="sm"
              >
                <XCircle size={14} className="mr-1" /> Cabut Persetujuan
              </Button>
              <Button
                onClick={() => deleteReview(review.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {Modal}

      {/* Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full">
            <img src={previewImage} alt="" className="w-full rounded-2xl shadow-2xl max-h-[80vh] object-contain" />
            <button onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all">✕</button>
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
                    <ReviewCard key={review.id} review={review} isPending={true} />
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
                    <ReviewCard key={review.id} review={review} isPending={false} />
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
