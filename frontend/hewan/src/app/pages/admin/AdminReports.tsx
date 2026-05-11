import { useState, useEffect } from 'react';
import { Order, Reservation } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, Package } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { getOrders, getReservations } from '../../services/api';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';

export default function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const fetchData = async () => {
    try {
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Gagal memuat pesanan:", error);
    }

    try {
      const fetchedReservations = await getReservations();
      setReservations(fetchedReservations);
    } catch (error) {
      console.error("Gagal memuat reservasi:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useLiveRefresh(fetchData, ['orders', 'reservations'], 8000, []);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthlyOrders = orders.filter(o =>
    isWithinInterval(new Date(o.createdAt), { start: monthStart, end: monthEnd })
  );

  const monthlyReservations = reservations.filter(r =>
    isWithinInterval(new Date(r.date), { start: monthStart, end: monthEnd })
  );

  const completedOrders = monthlyOrders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const completedReservations = monthlyReservations.filter(r => r.status === 'completed');
  const reservationRevenue = completedReservations.reduce((sum, r) => {
    const packagePrice = r.groomingPackage?.price || 0;
    return sum + r.adminFee + packagePrice;
  }, 0);

  const totalIncome = totalRevenue + reservationRevenue;

  const adoptionOrders = completedOrders.filter(o => o.orderType === 'adoption');
  const productOrders = completedOrders.filter(o => o.orderType === 'product');

  const estimatedExpenses = totalIncome * 0.3;
  const netProfit = totalIncome - estimatedExpenses;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Laporan Keuangan</CardTitle>
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
              className="px-4 py-2 border rounded-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-green-700">Total Pemasukan</p>
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-green-700">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  {format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-red-700">Estimasi Pengeluaran</p>
                  <TrendingDown className="text-red-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-red-700">
                  Rp {estimatedExpenses.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ~30% dari pemasukan
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-700">Laba Bersih</p>
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  Rp {netProfit.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Setelah pengeluaran
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-purple-700">Total Transaksi</p>
                  <ShoppingCart className="text-purple-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {completedOrders.length + completedReservations.length}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  Transaksi selesai
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} />
                  Rincian Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Adopsi Hewan</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {adoptionOrders.length} adopsi
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Pemasukan: Rp {adoptionOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Penjualan Produk</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {productOrders.length} pesanan
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Pemasukan: Rp {productOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pending & Proses</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {monthlyOrders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length} pesanan
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Rincian Reservasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Kunjungan Shelter</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {completedReservations.filter(r => r.type === 'shelter').length} kunjungan
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Admin Fee: Rp {(completedReservations.filter(r => r.type === 'shelter').length * 25000).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Layanan Grooming</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {completedReservations.filter(r => r.type === 'grooming').length} layanan
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Total: Rp {completedReservations
                      .filter(r => r.type === 'grooming')
                      .reduce((sum, r) => sum + (r.groomingPackage?.price || 0) + r.adminFee, 0)
                      .toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Reservasi Bulan Ini</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {monthlyReservations.length} reservasi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Catatan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Pengeluaran mencakup: makanan hewan, perawatan, gaji karyawan, operasional toko, dan utilitas</li>
                <li>• Estimasi pengeluaran dihitung sekitar 30% dari total pemasukan</li>
                <li>• Laporan ini hanya menampilkan transaksi yang sudah selesai (completed)</li>
                <li>• Untuk detail lebih lanjut, silakan cek menu Pesanan dan Reservasi</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
