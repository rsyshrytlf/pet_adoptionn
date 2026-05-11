import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/button';
import {
  Heart, Package, Calendar, Star, TrendingUp, LogOut, Home,
  Bell, ShoppingBag, X, CheckCheck, ChevronRight,
} from 'lucide-react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { AdminDataProvider } from '../../context/AdminDataContext';

export default function AdminDashboard() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isOpen: notifOpen,
    toggleOpen: toggleNotif,
    close: closeNotif,
    markAllRead,
    markOneRead,
    toasts,
    dismissToast,
  } = useAdminNotifications();

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeNotif();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeNotif]);

  if (!isAdmin) return null;

  const menuItems = [
    { path: '/admin/hewan',     label: 'Kelola Hewan',  icon: Heart },
    { path: '/admin/produk',    label: 'Kelola Produk', icon: Package },
    { path: '/admin/pesanan',   label: 'Pesanan',        icon: ShoppingBag },
    { path: '/admin/reservasi', label: 'Reservasi',      icon: Calendar },
    { path: '/admin/review',    label: 'Review',         icon: Star },
    { path: '/admin/laporan',   label: 'Laporan',        icon: TrendingUp },
  ];

  const notifTypeColor: Record<string, string> = {
    order:       'bg-blue-100 text-blue-700 border-blue-200',
    reservation: 'bg-purple-100 text-purple-700 border-purple-200',
    review:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  const toastBg: Record<string, string> = {
    order:       'from-blue-600 to-blue-700',
    reservation: 'from-purple-600 to-purple-700',
    review:      'from-yellow-500 to-yellow-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* ── FLOATING TOAST NOTIFICATIONS (muncul otomatis) ── */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto w-80 bg-gradient-to-r ${toastBg[toast.notif.type]} rounded-2xl shadow-2xl overflow-hidden`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="text-2xl flex-shrink-0">
                  {toast.notif.type === 'order' ? '🛒' : toast.notif.type === 'reservation' ? '📅' : '⭐'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-tight">{toast.notif.title}</p>
                  <p className="text-white/80 text-xs mt-0.5 truncate">{toast.notif.message}</p>
                  <button
                    onClick={() => {
                      dismissToast(toast.id);
                      navigate(toast.notif.path);
                    }}
                    className="mt-2 text-white/90 hover:text-white text-xs underline underline-offset-2 transition"
                  >
                    Lihat sekarang →
                  </button>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-white/60 hover:text-white transition flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Progress bar auto-dismiss */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: 'linear' }}
                style={{ transformOrigin: 'left' }}
                className="h-1 bg-white/30"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── HEADER ── */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="text-4xl"
              >
                🔐
              </motion.div>
              <div>
                <h1 className="font-bold text-white text-2xl">Admin Dashboard</h1>
                <p className="text-blue-200 text-sm">Meow my home Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">

              {/* 🔔 NOTIFICATION BELL */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleNotif}
                  className="relative p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                    >
                      {/* Header dropdown */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <span className="font-bold text-white flex items-center gap-2">
                          <Bell size={16} />
                          Notifikasi
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                              {unreadCount} baru
                            </span>
                          )}
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-blue-200 hover:text-white text-xs flex items-center gap-1 transition"
                          >
                            <CheckCheck size={14} />
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>

                      {/* List notifikasi */}
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center text-gray-400">
                            <Bell size={36} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Tidak ada notifikasi baru</p>
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <motion.div
                              key={notif.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition group`}
                            >
                              <div className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${notifTypeColor[notif.type]}`}>
                                {notif.type === 'order' ? '🛒' : notif.type === 'reservation' ? '📅' : '⭐'}
                              </div>
                              <button
                                className="flex-1 text-left"
                                onClick={() => {
                                  markOneRead(notif.id);
                                  navigate(notif.path);
                                }}
                              >
                                <p className="text-sm font-semibold text-gray-800 leading-tight">{notif.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notif.timestamp).toLocaleString('id-ID', {
                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </button>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => {
                                    markOneRead(notif.id);
                                    navigate(notif.path);
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <ChevronRight size={16} />
                                </button>
                                <button
                                  onClick={() => markOneRead(notif.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white text-blue-600"
              >
                <Home className="mr-2" size={18} />
                Ke Beranda
              </Button>

              <Button
                onClick={() => setShowLogoutDialog(true)}
                variant="outline"
                className="bg-white text-blue-600"
              >
                <LogOut size={18} />
              </Button>
            </div>

          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-6 gap-8">

          {/* SIDEBAR */}
          <aside className="lg:col-span-1">
            <nav className="space-y-2 sticky top-24">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                // Hitung badge per menu
                const menuNotifCount = notifications.filter(n => n.path === item.path).length;

                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      className={`w-full justify-start relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="mr-2" size={18} />
                      {item.label}
                      {menuNotifCount > 0 && (
                        <motion.span
                          key={menuNotifCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                        >
                          {menuNotifCount}
                        </motion.span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* MAIN — dibungkus AdminDataProvider agar semua halaman admin
              berbagi cache data yang sama tanpa fetch ulang saat pindah tab */}
          <main className="lg:col-span-5">
            <AdminDataProvider>
              <Outlet />
            </AdminDataProvider>
          </main>

        </div>
      </div>

      {/* ── MODAL LOGOUT ── */}
      {showLogoutDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center"
          >
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-xl font-bold text-purple-600 mb-2">Yakin mau logout?</h2>
            <p className="text-gray-500 text-sm mb-6">Sesi admin akan diakhiri</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-6 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
