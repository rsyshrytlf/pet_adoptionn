import { useState } from 'react';
import { Reservation } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Calendar } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, XCircle, UserCheck, Eye, Search } from 'lucide-react';
import { updateReservation } from '../../services/api';
import { emitDataChanged } from '../../hooks/useLiveRefresh';
import { useAdminData } from '../../context/AdminDataContext';

export default function AdminReservations() {
  // Ambil data dari shared cache — tidak fetch ulang saat pindah tab
  const { reservations, setReservations } = useAdminData();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Mengubah status reservasi, misalnya pending menjadi confirmed/cancelled.
  const updateReservationStatus = async (reservationId: string, status: Reservation['status']) => {
    try {
      await updateReservation(reservationId, { status });
      setReservations(prev => prev.map(r =>
        r.id === reservationId ? { ...r, status } : r
      ));
      emitDataChanged('reservations');
    } catch (e) {
      console.error(e);
    }
  };

  // Menandai user sudah hadir, lalu status reservasi dibuat completed.
  const markAsAttended = async (reservationId: string) => {
    try {
      await updateReservation(reservationId, { attended: true, status: 'completed' });
      setReservations(prev => prev.map(r =>
        r.id === reservationId ? { ...r, attended: true, status: 'completed' as const } : r
      ));
      emitDataChanged('reservations');
    } catch (e) {
      console.error(e);
    }
  };

  // Mengubah status mentah dari database menjadi badge berwarna.
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        // Ubah warna badge status dari class bg-... di bagian return ini.
        return <Badge className="bg-yellow-500">Menunggu</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500">Dikonfirmasi</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Dibatalkan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // normalize membuat pencarian tidak sensitif huruf besar/kecil.
  const normalize = (value: unknown) => String(value ?? '').toLowerCase();

  // Filter reservasi berdasarkan tanggal dan search bar.
  // Tambahkan field baru ke searchableText kalau ada data lain yang ingin ikut dicari.
  const filteredReservations = reservations.filter(r => {
    const matchesDate = selectedDate
      ? new Date(r.date).toDateString() === selectedDate.toDateString()
      : true;

    const keyword = searchTerm.trim().toLowerCase();
    if (!matchesDate) return false;
    if (!keyword) return true;

    const searchableText = [
      r.id,
      r.userName,
      r.userEmail,
      r.userPhone,
      r.type === 'shelter' ? 'shelter kunjungan' : 'grooming',
      r.time,
      r.status,
      r.attended ? 'hadir' : 'belum hadir',
      r.groomingPackage?.name,
      format(new Date(r.date), 'dd MMMM yyyy', { locale: idLocale }),
    ].map(normalize).join(' ');

    return searchableText.includes(keyword);
  });

  const pendingReservations = filteredReservations.filter(r => r.status === 'pending');
  const confirmedReservations = filteredReservations.filter(r => r.status === 'confirmed');

  return (
    <div className="space-y-6">
      {/* Lightbox preview bukti transfer.
          Ubah posisi dari fixed inset-0 dan flex items-center justify-center.
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
          <CardTitle className="text-2xl">Kelola Reservasi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search bar reservasi.
              Ubah posisi icon dari left-3/top-1/2.
              Ubah warna border input dari border-purple-200/focus:border-purple-500. */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Cari nama, email, no HP, jenis reservasi, paket, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-500"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              {/* Kalender filter tanggal.
                  Ubah posisi layout dari grid lg:grid-cols-2 gap-8 di parent atas. */}
              <h3 className="font-bold mb-4">Pilih Tanggal untuk Lihat Reservasi</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={idLocale}
                className="rounded-md border"
              />
              {selectedDate && (
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  {/* Box ringkasan jumlah reservasi pada tanggal yang dipilih.
                      Ubah warna dari bg-blue-50 dan text-blue-600. */}
                  <p className="font-semibold">
                    Reservasi pada {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}:
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredReservations.length} reservasi
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                {/* Daftar reservasi yang masih menunggu konfirmasi admin. */}
                <h3 className="font-bold mb-4">
                  Pending Konfirmasi ({pendingReservations.length})
                </h3>
                <div className="space-y-3">
                  {pendingReservations.length === 0 ? (
                    <p className="text-gray-500 text-sm">Tidak ada reservasi pending</p>
                  ) : (
                    pendingReservations.map(reservation => (
                      <Card key={reservation.id} className="bg-yellow-50">
                        {/* Ubah warna card pending dari bg-yellow-50. */}
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold">{reservation.userName}</p>
                              <p className="text-sm text-gray-600">{reservation.userEmail}</p>
                              <p className="text-sm text-blue-600 font-medium">
                                📱 {reservation.userPhone || <span className="text-red-400 italic">No HP belum diisi</span>}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(reservation.date), 'dd MMM', { locale: idLocale })} • {reservation.time}
                              </p>
                              <p className="text-sm font-semibold mt-1">
                                {reservation.type === 'shelter' ? '🏠 Kunjungan Shelter' : '✂️ Grooming'}
                              </p>
                              {reservation.groomingPackage && (
                                <p className="text-xs text-blue-600">
                                  {reservation.groomingPackage.name}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(reservation.status)}
                          </div>
                          {reservation.paymentProof && (
                            <div className="mb-4 space-y-2">
                              {/* Bukti transfer. Klik gambar untuk preview besar. */}
                              <p className="text-sm font-semibold text-gray-700">📎 Bukti Transfer:</p>
                              <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
                                onClick={() => setPreviewImage(reservation.paymentProof!)}>
                                <img
                                  src={reservation.paymentProof}
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
                          <div className="flex gap-2">
                            {/* Ubah warna tombol konfirmasi dari bg-green-600/hover:bg-green-700. */}
                            <Button
                              onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Konfirmasi
                            </Button>
                            <Button
                              onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div>
                {/* Daftar reservasi yang sudah dikonfirmasi dan menunggu kehadiran. */}
                <h3 className="font-bold mb-4">
                  Terkonfirmasi ({confirmedReservations.length})
                </h3>
                <div className="space-y-3">
                  {confirmedReservations.length === 0 ? (
                    <p className="text-gray-500 text-sm">Tidak ada reservasi terkonfirmasi</p>
                  ) : (
                    confirmedReservations.map(reservation => (
                      <Card key={reservation.id} className="bg-blue-50">
                        {/* Ubah warna card terkonfirmasi dari bg-blue-50. */}
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold">{reservation.userName}</p>
                              <p className="text-sm text-gray-600">{reservation.userEmail}</p>
                              <p className="text-sm text-blue-600 font-medium">
                                📱 {reservation.userPhone || <span className="text-red-400 italic">No HP belum diisi</span>}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(reservation.date), 'dd MMM', { locale: idLocale })} • {reservation.time}
                              </p>
                              <p className="text-sm font-semibold mt-1">
                                {reservation.type === 'shelter' ? '🏠 Kunjungan Shelter' : '✂️ Grooming'}
                              </p>
                              {reservation.groomingPackage && (
                                <p className="text-xs text-blue-600">
                                  {reservation.groomingPackage.name}
                                </p>
                              )}
                            </div>
                            {reservation.attended ? (
                              <Badge className="bg-green-500">Hadir</Badge>
                            ) : (
                              getStatusBadge(reservation.status)
                            )}
                          </div>
                          {/* Tombol ini dipakai admin setelah pelanggan benar-benar datang. */}
                          {!reservation.attended && (
                            <Button
                              onClick={() => markAsAttended(reservation.id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <UserCheck size={14} className="mr-1" />
                              Tandai Hadir
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
