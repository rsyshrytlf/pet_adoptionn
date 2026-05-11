/**
 * AdminDataContext
 * ─────────────────────────────────────────────────────────────
 * Cache terpusat untuk data admin (orders & reservations).
 * Hidup di level AdminDashboard sehingga data TIDAK hilang saat
 * admin berpindah antar halaman (Pesanan → Review → Reservasi, dll).
 *
 * Cara pakai di halaman admin:
 *   const { orders, reservations, setOrders, refresh } = useAdminData();
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
  type ReactNode,
} from 'react';
import { Order, Reservation } from '../types';
import { getOrders, getReservations } from '../services/api';
import { useLiveRefresh } from '../hooks/useLiveRefresh';

interface AdminDataContextValue {
  orders: Order[];
  reservations: Reservation[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  loadingOrders: boolean;
  loadingReservations: boolean;
  /** Paksa refresh semua data sekarang */
  refresh: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Ref agar fetch tidak duplikat jika dipanggil bersamaan
  const fetchingRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const data = await getOrders();
      setOrders(data);
    } catch (e) {
      console.error('AdminDataContext: gagal fetch orders', e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      setLoadingReservations(true);
      const data = await getReservations();
      setReservations(data);
    } catch (e) {
      console.error('AdminDataContext: gagal fetch reservations', e);
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    await Promise.all([fetchOrders(), fetchReservations()]);
    fetchingRef.current = false;
  }, [fetchOrders, fetchReservations]);

  // Fetch pertama kali saat provider mount
  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh setiap 5 detik (polling ringan sebagai fallback)
  useLiveRefresh(refresh, ['orders', 'reservations', 'reviews'], 5000, []);

  return (
    <AdminDataContext.Provider value={{
      orders, setOrders,
      reservations, setReservations,
      loadingOrders, loadingReservations,
      refresh,
    }}>
      {children}
    </AdminDataContext.Provider>
  );
}

/** Hook untuk mengakses data admin dari halaman manapun di dalam AdminDashboard */
export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData harus digunakan di dalam AdminDataProvider');
  return ctx;
}
