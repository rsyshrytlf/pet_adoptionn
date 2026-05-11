import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrders, getReservations } from '../services/api';

export interface AdminNotification {
  id: string;
  type: 'order' | 'reservation' | 'review';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  path: string;
}

const STORAGE_KEY = 'admin_notifications_seen';
const TOASTED_STORAGE_KEY = 'admin_notifications_toasted';
// 2 detik = terasa instan, tidak membebani server secara berlebihan
const POLL_INTERVAL = 2000;

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function getToastedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(TOASTED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveToastedIds(ids: Set<string>) {
  localStorage.setItem(TOASTED_STORAGE_KEY, JSON.stringify([...ids]));
}

const INACTIVE_ORDER_STATUS = new Set(['completed', 'cancelled']);
const INACTIVE_RESERVATION_STATUS = new Set(['completed', 'cancelled']);

async function scanNewData(): Promise<AdminNotification[]> {
  const notifications: AdminNotification[] = [];
  const seenIds = getSeenIds();

  // ── ORDERS ──
  try {
    const orders = await getOrders();
    for (const o of orders) {
      if (INACTIVE_ORDER_STATUS.has(o.status)) continue;
      const notifId = `order_${o.id}`;
      if (!seenIds.has(notifId)) {
        const typeLabel =
          o.orderType === 'adoption' ? 'Adopsi Hewan'
          : o.orderType === 'grooming' ? 'Grooming'
          : 'Produk';
        notifications.push({
          id: notifId,
          type: 'order',
          title: `🛒 Pesanan Baru — ${typeLabel}`,
          message: `${o.userName || o.userData?.name || 'User'} • Kode: ${o.uniqueCode}`,
          timestamp: new Date(o.createdAt).getTime() || Date.now(),
          read: false,
          path: '/admin/pesanan',
        });
      }
    }
  } catch { /* skip */ }

  // ── RESERVATIONS ──
  try {
    const reservations = await getReservations();
    for (const r of reservations) {
      if (INACTIVE_RESERVATION_STATUS.has(r.status)) continue;
      const notifId = `reservation_${r.id}`;
      if (!seenIds.has(notifId)) {
        const typeLabel = r.type === 'shelter' ? 'Kunjungan Shelter' : 'Grooming';
        notifications.push({
          id: notifId,
          type: 'reservation',
          title: `📅 Reservasi Baru — ${typeLabel}`,
          message: `${r.userName} • ${new Date(r.date).toLocaleDateString('id-ID')} pukul ${r.time}`,
          timestamp: r.createdAt || Date.now(),
          read: false,
          path: '/admin/reservasi',
        });
      }
    }
  } catch { /* skip */ }

  // ── REVIEWS ──
  try {
    const orders = await getOrders();
    for (const o of orders) {
      if (!o.review || o.review.approved === true) continue;
      const notifId = `review_${o.id}`;
      if (!seenIds.has(notifId)) {
        notifications.push({
          id: notifId,
          type: 'review',
          title: `⭐ Review Baru — Menunggu Persetujuan`,
          message: `${o.userName || o.userData?.name || 'User'} • ${o.review.rating} bintang`,
          timestamp: Date.now(),
          read: false,
          path: '/admin/review',
        });
      }
    }
  } catch { /* skip */ }

  return notifications.sort((a, b) => b.timestamp - a.timestamp);
}

export interface IncomingToast {
  id: string;
  notif: AdminNotification;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // antrian toast yang muncul otomatis di layar
  const [toasts, setToasts] = useState<IncomingToast[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const poll = useCallback(async () => {
    try {
      const newNotifs = await scanNewData();
      const newIds = new Set(newNotifs.map(n => n.id));

      // Cari notif yang benar-benar baru (belum pernah ada sebelumnya)
      const toastedIds = getToastedIds();
      const appeared: AdminNotification[] = [];
      for (const n of newNotifs) {
        if (!prevIdsRef.current.has(n.id) && !toastedIds.has(n.id)) {
          appeared.push(n);
        }
      }

      prevIdsRef.current = newIds;
      setNotifications(newNotifs);

      if (appeared.length > 0) {
        const toastToShow = appeared[0];
        toastedIds.add(toastToShow.id);
        saveToastedIds(toastedIds);
        setToasts([{ id: `toast_${toastToShow.id}`, notif: toastToShow }]);
      }
    } catch { /* skip */ }
  }, []);

  // Jalankan polling setiap 2 detik
  useEffect(() => {
    poll(); // langsung cek saat pertama mount
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Tab kembali aktif → cek langsung
    const handleVisible = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [poll]);

  // Auto-dismiss toast setelah 3 detik
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts([]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const unreadCount = notifications.length;

  const markAllRead = useCallback(() => {
    const seenIds = getSeenIds();
    notifications.forEach(n => seenIds.add(n.id));
    saveSeenIds(seenIds);
    const toastedIds = getToastedIds();
    notifications.forEach(n => toastedIds.add(n.id));
    saveToastedIds(toastedIds);
    setNotifications([]);
    prevIdsRef.current = new Set();
    setIsOpen(false);
    setToasts([]);
  }, [notifications]);

  const markOneRead = useCallback((id: string) => {
    const seenIds = getSeenIds();
    seenIds.add(id);
    saveSeenIds(seenIds);
    const toastedIds = getToastedIds();
    toastedIds.add(id);
    saveToastedIds(toastedIds);
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      prevIdsRef.current = new Set(next.map(n => n.id));
      return next;
    });
  }, []);

  const toggleOpen = useCallback(() => setIsOpen(p => !p), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    notifications,
    unreadCount,
    isOpen,
    toggleOpen,
    close,
    markAllRead,
    markOneRead,
    toasts,
    dismissToast,
  };
}
