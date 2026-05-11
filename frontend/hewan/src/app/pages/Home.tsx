import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Heart, Calendar, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useState, useEffect } from 'react';

interface ReviewData {
  name: string;
  rating: number;
  comment: string;
  image?: string | null;
}

import { getOrders } from '../services/api';
import { useLiveRefresh } from '../hooks/useLiveRefresh';

export default function Home() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  const fetchReviews = async () => {
    try {
      const orders = await getOrders();
      const approvedReviews = orders
        .filter((o: any) => o.review && o.review.approved)
        .map((o: any) => ({
          name: o.review.userName || o.userData?.name || o.userName || 'User',
          rating: Number(o.review.rating),
          comment: o.review.comment,
          image: o.review.image || null,
        }));
      setReviews(approvedReviews);
    } catch (e) {
      console.error("Gagal memuat ulasan", e);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);
  // useLiveRefresh(fetchReviews, ['reviews', 'orders'], 10000, []);

  useEffect(() => {
  fetchReviews();
}, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 pb-2 sm:text-5xl md:text-6xl">
            Selamat Datang di Meow my home
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
          Memberikan harapan baru bagi hewan-hewan terlantar untuk menemukan rumah dan kasih sayang yang layak 🐾
          </p>

          {/* berhenti hewan
        <div className="flex justify-center gap-4 text-4xl mb-8 sm:gap-8 sm:text-6xl">
  <div>😺</div>
  <div>🐶</div>
</div> */}

          <Link to="/adopsi">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl px-8 py-6">
              <Heart className="mr-2" size={24} />
              Mulai Adopsi Sekarang
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-pink-100 to-pink-200 border-none shadow-xl hover:shadow-2xl transition">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🐱🐶</div>
              <h3 className="text-2xl font-bold text-pink-700 mb-4">Adopsi Hewan</h3>
              <p className="text-gray-700 mb-6">Bantu hewan rescue menemukan rumah dan keluarga baru yang penuh kasih sayang.</p>
              <Link to="/adopsi"><Button className="bg-pink-600 hover:bg-pink-700">Lihat Hewan</Button></Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-none shadow-xl hover:shadow-2xl transition">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">✂️🛁</div>
              <h3 className="text-2xl font-bold text-purple-700 mb-4">Layanan Grooming</h3>
              <p className="text-gray-700 mb-6">Perawatan grooming profesional untuk menjaga kebersihan, kesehatan, dan kenyamanan hewan peliharaan Anda.</p>
              <Link to="/reservasi"><Button className="bg-purple-600 hover:bg-purple-700">Reservasi Sekarang</Button></Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-none shadow-xl hover:shadow-2xl transition">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🛍️🎀</div>
              <h3 className="text-2xl font-bold text-blue-700 mb-4">Toko Perlengkapan</h3>
              <p className="text-gray-700 mb-6">Lengkapi kebutuhan terbaik untuk hewan kesayangan Anda, mulai dari makanan hingga aksesoris.</p>
              <Link to="/belanja"><Button className="bg-blue-600 hover:bg-blue-700">Belanja Sekarang</Button></Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="bg-white/80 backdrop-blur rounded-3xl p-12 shadow-xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-purple-700 mb-6">Tentang Meow my home</h2>
            <p className="text-gray-700 text-lg mb-4">
              Kami adalah shelter hewan yang berdedikasi untuk memberikan rumah yang penuh kasih sayang untuk hewan-hewan yang membutuhkan.
            </p>
            <p className="text-gray-700 text-lg mb-4">
              Setiap hewan di shelter kami mendapatkan perawatan terbaik, vaksinasi, dan kasih sayang sambil menunggu keluarga barunya.
            </p>
            <div className="space-y-2 mt-6">
              {['Hewan terawat dengan baik', 'Sudah divaksin dan diperiksa kesehatan', 'Layanan grooming profesional', 'Toko perlengkapan lengkap'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <Star className="text-yellow-500" fill="currentColor" size={18} />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: '50+', label: 'Hewan Diadopsi', from: 'from-pink-200', to: 'to-pink-300', rotate: 5 },
              { val: '100+', label: 'Pelanggan Puas', from: 'from-purple-200', to: 'to-purple-300', rotate: -5 },
              { val: '3', label: 'Tahun Beroperasi', from: 'from-blue-200', to: 'to-blue-300', rotate: -5 },
              { val: '💯', label: 'Dedikasi Penuh', from: 'from-green-200', to: 'to-green-300', rotate: 5 },
            ].map(item => (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.05, rotate: item.rotate }}
                className={`bg-gradient-to-br ${item.from} ${item.to} rounded-2xl p-8 text-center`}
              >
                <div className="text-5xl mb-2">{item.val}</div>
                <div className="text-gray-700 font-semibold">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + REVIEW SECTION */}
      <section className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl p-12 text-white shadow-2xl space-y-10">

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Siap Memberikan Rumah Baru?</h2>
          <p className="text-xl mb-6">Kunjungi shelter kami atau reservasi kunjungan Anda sekarang!</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/reservasi">
              <Button size="lg" variant="outline" className="bg-white text-purple-600 hover:bg-gray-100">
                <Calendar className="mr-2" /> Reservasi Kunjungan
              </Button>
            </Link>
            <Link to="/adopsi">
              <Button size="lg" variant="outline" className="bg-white text-purple-600 hover:bg-gray-100">
                <Heart className="mr-2" /> Lihat Hewan
              </Button>
            </Link>
          </div>
        </div>

        {/* REVIEW */}
        <div>
          <h3 className="text-3xl font-bold text-center mb-2">⭐ Apa Kata Mereka?</h3>
          <p className="text-center text-white/70 text-sm mb-8">Cerita nyata dari keluarga adopter kami</p>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-white/70">Belum ada ulasan. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl flex flex-col gap-3"
                >
                  {/* Foto review */}
                  {r.image && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-100">
                      <img src={r.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Avatar + Nama */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 leading-tight">{r.name}</p>
                      <p className="text-xs text-gray-400">Pelanggan Meow my home</p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= r.rating ? 'text-yellow-400' : 'text-gray-200'}
                        fill={star <= r.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>

                  {/* Komentar */}
                  <p className="text-sm text-gray-600 italic leading-relaxed">"{r.comment}"</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </section>
    </div>
  );
}
