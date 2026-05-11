import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Reservation as ReservationType, GroomingPackage } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Calendar as CalendarIcon, Scissors, Home as HomeIcon, CheckCircle, Loader2 } from 'lucide-react';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useModalAlert } from '../components/ui/modal-alert';
import { getReservations, createReservation, uploadImage, getGroomingPackages } from '../services/api';
import { useLiveRefresh } from '../hooks/useLiveRefresh';



export default function Reservation() {
  
  const [reservationType, setReservationType] = useState<'shelter' | 'grooming'>('shelter');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<GroomingPackage | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { showAlert, Modal } = useModalAlert();
  const [allReservations, setAllReservations] = useState<ReservationType[]>([]);
  const [groomingPackages, setGroomingPackages] = useState<GroomingPackage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const adminFee = 25000;
  const groomingPrice = selectedPackage?.price || 0;
  const { isAuthenticated, user } = useAuth();
  const [formUser, setFormUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();

  const fetchReservations = async () => {
    try {
      const data = await getReservations();
      setAllReservations(data);
    } catch (error) {
      console.error("Gagal memuat reservasi", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await getGroomingPackages();
      setGroomingPackages(data);
    } catch (error) {
      console.error("Gagal memuat paket grooming", error);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchPackages();
  }, []);
  useLiveRefresh(fetchReservations, ['reservations'], 6000, []);

  const timeSlots = [
    '09:00', '11:00', '13:00', '15:00', '17:00'
  ];

 const MAX_PER_SLOT = 8;
 const MAX_PER_DAY = 40;

  // Hitung reservasi aktif (pending + confirmed) untuk tanggal tertentu
  // Cancelled TIDAK dihitung → slot terbuka kembali jika admin tolak
  const getReservationsForDate = (date: Date): ReservationType[] => {
    return allReservations.filter((r: ReservationType) => {
      const resDate = new Date(r.date);
      return (
        resDate.toDateString() === date.toDateString() &&
        r.status !== 'cancelled' // pending + confirmed keduanya dihitung
      );
    });
  };

  // Jumlah reservasi aktif pada slot waktu tertentu
  const getSlotCount = (date: Date, time: string): number => {
    return getReservationsForDate(date).filter((r: ReservationType) => r.time === time).length;
  };

  const sortReservations = (data: ReservationType[]) => {
    return data.sort((a, b) => {
      if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
      if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  };

  const isTimeSlotAvailable = (date: Date, time: string): boolean => {
    return getSlotCount(date, time) < MAX_PER_SLOT;
  };

  const getDayReservationCount = (date: Date): number => {
    return getReservationsForDate(date).length;
  };

  const isDateAvailable = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    if (isBefore(date, tomorrow)) return false;
    return getDayReservationCount(date) < MAX_PER_DAY;
  };

  const handleReservation = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMsg("Pilih tanggal & waktu dulu ya 💖");
setShowError(true);
      return;
    }

    if (reservationType === 'grooming' && !selectedPackage) {
      showAlert('Mohon pilih paket grooming terlebih dahulu sebelum melanjutkan.', 'warning', 'Paket Belum Dipilih');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmReservation = async () => {
    if (!paymentProof) {
      setShowConfirmDialog(false);
      setErrorMsg("Upload bukti transfer Admin Rp 25.000 dulu ya 💖");
      setShowError(true);
      return;
    }

    if (!formUser.phone || formUser.phone.trim() === '') {
      setErrorMsg("Mohon isi Nomor HP kamu dulu di bagian Edit detail reservasi 📱");
      setShowError(true);
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(paymentProof);

      const payload = {
        id: 'REV' + Date.now(),
        user_id: user!.id,
        user_name: formUser.name,
        user_email: formUser.email,
        user_phone: formUser.phone,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        time: selectedTime,
        type: reservationType,
        grooming_package: reservationType === 'grooming' ? selectedPackage : null,
        status: 'pending',
        admin_fee: 25000,
        payment_proof: imageUrl,
        attended: false,
        created_at_timestamp: Date.now()
      };

      await createReservation(payload);

      setShowConfirmDialog(false);
      setShowSuccess(true);
    } catch (e: any) {
      console.error(e);
      setShowConfirmDialog(false);
      setErrorMsg(e.message || "Terjadi kesalahan saat memproses reservasi");
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {Modal}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 pb-2 sm:text-4xl md:text-5xl"
        >
          Reservasi
        </motion.h1>
        <p className="text-xl text-gray-700">Pilih jenis layanan yang Anda inginkan</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card
          className={`cursor-pointer transition-all duration-300 ${
            reservationType === 'shelter'
              ? 'ring-4 ring-purple-500 bg-gradient-to-br from-purple-50 to-purple-100'
              : 'hover:shadow-xl'
          }`}
          onClick={() => setReservationType('shelter')}
        >
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏠
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-purple-700 mb-2">Kunjungi Shelter</h3>
            <p className="text-gray-600">
              Datang langsung ke shelter untuk bertemu dan mengenal hewan-hewan yang siap diadopsi
            </p>
            {reservationType === 'shelter' && (
              <Badge className="mt-4 bg-purple-600">Dipilih</Badge>
            )}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all duration-300 ${
            reservationType === 'grooming'
              ? 'ring-4 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100'
              : 'hover:shadow-xl'
          }`}
          onClick={() => setReservationType('grooming')}
        >
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✂️
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-blue-700 mb-2">Layanan Grooming</h3>
            <p className="text-gray-600">
            Pilih paket grooming terbaik untuk membuat hewan kesayangan Anda lebih bersih, sehat, dan nyaman
            </p>
            {reservationType === 'grooming' && (
              <Badge className="mt-4 bg-blue-600">Dipilih</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {reservationType === 'grooming' && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-blue-700">Pilih Paket Grooming</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groomingPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedPackage?.id === pkg.id
                    ? 'ring-4 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100'
                    : 'hover:shadow-xl'
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-blue-700 mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-purple-600 mb-3">
                    Rp {pkg.price.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">Durasi: {pkg.duration}</p>
                  <div className="space-y-1">
                    {pkg.services.map((service, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <Badge className="mt-4 bg-blue-600 w-full">Dipilih</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-purple-700 mb-4">Proses Grooming Kami</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-4xl mb-2">🛁</div>
                <p className="font-semibold">Mandi dengan shampo khusus</p>
              </div>
              <div>
                <div className="text-4xl mb-2">✂️</div>
                <p className="font-semibold">Hair cut styling profesional</p>
              </div>
              <div>
                <div className="text-4xl mb-2">💆</div>
                <p className="font-semibold">Treatment spa & massage</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">
              Pilih Tanggal & Waktu Reservasi
            </h2>

            <div className="space-y-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => !isDateAvailable(date)}
                  locale={idLocale}
                  className="rounded-md border"
                />
              </div>

              {selectedDate && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">
                    Pilih Waktu untuk {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
                  </Label>
                  <p className="text-sm text-gray-600">
                    Slot yang tersedia (Maksimal 8 orang per slot, 40 orang per hari)
                  </p>

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {timeSlots.map((time) => {
                      const count = getSlotCount(selectedDate, time);
                      const available = count < MAX_PER_SLOT;
                      const remaining = MAX_PER_SLOT - count;
                      const isSelected = selectedTime === time;
                      return (
                        <Button
                          key={time}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`flex flex-col h-auto py-3 ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : available
                              ? 'hover:bg-purple-100 hover:border-purple-400'
                              : 'opacity-50 cursor-not-allowed bg-red-50 border-red-200'
                          }`}
                          onClick={() => available && setSelectedTime(time)}
                          disabled={!available}
                        >
                          <span className="font-bold text-base">{time}</span>
                          {available ? (
                            <span className={`text-xs mt-1 ${ isSelected ? 'text-white/80' : 'text-green-600'}`}>
                              {remaining} slot tersisa
                            </span>
                          ) : (
                            <span className="text-xs mt-1 text-red-500 font-semibold">Penuh</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold mb-2 text-blue-800">📋 Informasi Penting:</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Reservasi harus dilakukan H-1 (minimal 1 hari sebelumnya)</li>
                      <li>• Admin fee: <strong>Rp 25.000</strong></li>
                      <li>• Maksimal <strong>40 orang per hari</strong></li>
                      <li>• Maksimal <strong>8 orang per slot waktu</strong> (shelter + grooming digabung)</li>
                      <li>• Slot akan <strong>otomatis tertutup</strong> begitu ada 8 reservasi (termasuk yang belum dikonfirmasi)</li>
                      <li>• Slot terbuka kembali jika admin <strong>menolak</strong> reservasi</li>
                      <li>• Senin-Minggu: 09.00-16.00</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleReservation}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    size="lg"
                    disabled={!selectedTime}
                  >
                    <CalendarIcon className="mr-2" />
                    Buat Reservasi
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Konfirmasi Reservasi</DialogTitle>
            <DialogDescription>
              Mohon transfer admin fee dan upload bukti transfer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">Detail Reservasi:</h4>
                <button
                  onClick={() => setIsEdit(!isEdit)}
                  className="text-sm text-blue-600 font-semibold"
                >
                  {isEdit ? 'Selesai' : 'Edit'}
                </button>
              </div>

              <div className="space-y-1 text-sm mb-4 pb-4 border-b border-blue-200">
                <p><strong>Jenis:</strong> {reservationType === 'shelter' ? 'Kunjungi Shelter' : 'Grooming'}</p>
                {reservationType === 'grooming' && selectedPackage && (
                  <p><strong>Paket:</strong> {selectedPackage.name} - Rp {selectedPackage.price.toLocaleString('id-ID')}</p>
                )}
                <p><strong>Tanggal:</strong> {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}</p>
                <p><strong>Waktu:</strong> {selectedTime}</p>
              </div>

              {!isEdit ? (
                <div className="space-y-1 text-sm">
                  <p><strong>Nama:</strong> {formUser.name}</p>
                  <p><strong>Email:</strong> {formUser.email}</p>
                  <p><strong>No. HP:</strong> {formUser.phone}</p>
                  <p><strong>Alamat Lengkap:</strong> {formUser.address}</p>
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
                    <Label htmlFor="reservationAddress">Alamat Lengkap:</Label>
                    <textarea
                      id="reservationAddress"
                      placeholder="Masukkan alamat lengkap Anda"
                      value={formUser.address}
                      onChange={(e) => setFormUser({ ...formUser, address: e.target.value })}
                      className="w-full border border-blue-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              {reservationType === 'shelter' && (
  <div className="bg-green-50 p-4 rounded-lg">
    <p className="font-bold text-green-700">
      Total yang dibayar sekarang:
    </p>
    <p className="text-xl font-bold text-green-600">
      Rp {adminFee.toLocaleString('id-ID')}
    </p>
  </div>
)}
{reservationType === 'grooming' && (
  <div className="bg-yellow-100 p-4 rounded-lg space-y-2">
    <p className="font-bold text-yellow-700">
      Pembayaran Sekarang (Admin Fee):
    </p>
    <p className="text-lg font-bold text-yellow-600">
      Rp {adminFee.toLocaleString('id-ID')}
    </p>

    <div className="border-t pt-2 mt-2">
      <p className="text-sm text-gray-700">
        Sisa pembayaran saat datang:
      </p>
      <p className="text-lg font-bold text-purple-600">
        Rp {groomingPrice.toLocaleString('id-ID')}
      </p>
    </div>
  </div>
)}
              <h4 className="font-bold mb-2">Pembayaran Admin Fee:</h4>
              <p className="text-base mb-1 text-gray-700">Transfer ke BCA: <span className="text-lg font-bold text-gray-900">24518266</span></p>
              <p className="text-base mb-2 text-gray-700">a.n. <span className="text-lg font-bold text-gray-900">Meow my home</span></p>
              <p className="text-base">
                Total Admin Fee: <span className="text-lg font-bold text-gray-900">Rp 25.000</span>
              </p>
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
            </div>

            <Button
              onClick={confirmReservation}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 animate-spin" size={18} /> Memproses...</>
              ) : (
                <><CheckCircle className="mr-2" /> Konfirmasi Reservasi</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

{showSuccess && (
 <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl text-center">

      <div className="text-4xl mb-2">🎉</div>

      <h2 className="text-xl font-bold text-purple-600 mb-2">
        Reservasi Berhasil!
      </h2>

      <p className="text-gray-600 text-sm mb-4">
       Reservasi Masuk Waiting List 💖
      </p>

      <button
        onClick={() => {
          setShowSuccess(false);
          navigate('/aktivitas');
        }}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg"
      >
        Lihat Aktivitas
      </button>

    </div>
  </div>
)}
{showError && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-xl text-center">

      <div className="text-3xl mb-2">⚠️</div>

      <h2 className="font-bold text-lg text-red-500 mb-2">
        Oops!
      </h2>

      <p className="text-gray-600 text-sm mb-4">
        {errorMsg}
      </p>

      <button
        onClick={() => setShowError(false)}
        className="w-full bg-red-500 text-white py-2 rounded-lg"
      >
        OK
      </button>

    </div>
  </div>
)}

    </div>
  );
}
