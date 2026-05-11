import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/useCart';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { motion } from 'motion/react';
import { Home, Heart, Calendar, ShoppingBag, ShoppingCart, ClipboardList, LogIn, LogOut, User, MessageCircle, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

export default function Layout() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Jalankan pemantauan aktivitas (idle timeout) di seluruh layout (termasuk admin)
  useIdleTimeout();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const closeMobileMenu = () => setShowMobileMenu(false);

  if (isAdminRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Animasi Kucing Berjalan */}
      <motion.div
        className="fixed top-1/4 z-0 pointer-events-none"
        animate={{
          x: ['0vw', '100vw'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <div className="text-8xl">🐱</div>
      </motion.div>

      <motion.div
        className="fixed top-1/2 z-0 pointer-events-none"
        animate={{
          x: ['100vw', '0vw'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
          delay: 5
        }}
      >
        <div className="text-8xl">🐶</div>
      </motion.div>

      <motion.div
        className="fixed top-3/4 z-0 pointer-events-none"
        animate={{
          x: ['0vw', '100vw'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
          delay: 10
        }}
      >
        <div className="text-8xl">🐱</div>
      </motion.div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 shadow-lg">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-2" onClick={closeMobileMenu}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl"
              >
                🏠
              </motion.div>
              <h1 className="truncate font-bold text-white text-lg sm:text-xl md:text-2xl">Meow my home</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-white hover:text-pink-200 transition">
                <Home size={20} />
                <span>Beranda</span>
              </Link>
              <Link to="/adopsi" className="flex items-center gap-2 text-white hover:text-pink-200 transition">
                <Heart size={20} />
                <span>Adopsi</span>
              </Link>
              <Link to="/reservasi" className="flex items-center gap-2 text-white hover:text-pink-200 transition">
                <Calendar size={20} />
                <span>Reservasi</span>
              </Link>
              <Link to="/belanja" className="flex items-center gap-2 text-white hover:text-pink-200 transition">
                <ShoppingBag size={20} />
                <span>Belanja</span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/keranjang" className="flex items-center gap-2 text-white hover:text-pink-200 transition relative">
                    <ShoppingCart size={20} />
                    <span>Keranjang</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/aktivitas" className="flex items-center gap-2 text-white hover:text-pink-200 transition">
                    <ClipboardList size={20} />
                    <span>Aktivitas</span>
                  </Link>
                </>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="text-white flex items-center gap-2">
                    <User size={20} />
                    <span>{user?.name}</span>
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      variant="outline"
                      className="bg-white text-purple-600"
                    >
                      Dashboard Admin
                    </Button>
                  )}
                 <Button 
  onClick={() => setShowLogoutDialog(true)} 
  variant="outline" 
  className="bg-white text-purple-600"
>
  <LogOut size={20} />
</Button>
                </>
              ) : (
                <Button onClick={() => navigate('/login')} variant="outline" className="bg-white text-purple-600">
                  <LogIn size={20} className="mr-2" />
                  Login
                </Button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMobileMenu((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white md:hidden"
              aria-label={showMobileMenu ? 'Tutup menu' : 'Buka menu'}
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="mt-3 rounded-2xl bg-white/95 p-3 shadow-xl md:hidden">
              <nav className="grid grid-cols-2 gap-2 text-sm font-semibold text-purple-700">
                <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-purple-50">
                  <Home size={18} />
                  <span>Beranda</span>
                </Link>
                <Link to="/adopsi" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-purple-50">
                  <Heart size={18} />
                  <span>Adopsi</span>
                </Link>
                <Link to="/reservasi" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-purple-50">
                  <Calendar size={18} />
                  <span>Reservasi</span>
                </Link>
                <Link to="/belanja" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-purple-50">
                  <ShoppingBag size={18} />
                  <span>Belanja</span>
                </Link>
                {isAuthenticated && (
                  <>
                    <Link to="/keranjang" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-purple-50">
                      <ShoppingCart size={18} />
                      <span>Keranjang</span>
                      {cartCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/aktivitas" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-purple-50">
                      <ClipboardList size={18} />
                      <span>Aktivitas</span>
                    </Link>
                  </>
                )}
              </nav>

              <div className="mt-3 border-t border-purple-100 pt-3">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700">
                      <User size={18} />
                      <span className="truncate">{user?.name}</span>
                    </div>
                    {isAdmin && (
                      <Button
                        onClick={() => {
                          closeMobileMenu();
                          navigate('/admin');
                        }}
                        variant="outline"
                        className="w-full bg-white text-purple-600"
                      >
                        Dashboard Admin
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        closeMobileMenu();
                        setShowLogoutDialog(true);
                      }}
                      variant="outline"
                      className="w-full bg-white text-purple-600"
                    >
                      <LogOut size={18} className="mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/login');
                    }}
                    variant="outline"
                    className="w-full bg-white text-purple-600"
                  >
                    <LogIn size={18} className="mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto flex-1 px-4 py-6 md:py-8">
        <Outlet />
      </main>

{showLogoutDialog && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="w-[calc(100%-2rem)] max-w-xs rounded-xl bg-white p-6 text-center shadow-xl">

      <h2 className="text-xl font-bold text-purple-600 mb-2">
        Meow my home
      </h2>

      <p className="text-gray-700 mb-4">
        Yakin mau logout?
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setShowLogoutDialog(false)}
          className="px-4 py-2 rounded-lg border"
        >
          Batal
        </button>

        <button
         onClick={() => {
  setShowLogoutDialog(false);
  logout();
  navigate('/');
}}
          className="px-4 py-2 rounded-lg bg-red-500 text-white"
        >
          Logout
        </button>
      </div>

    </div>
  </div>
)}





      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/6288801874579"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi admin lewat WhatsApp"
        title="Hubungi admin lewat WhatsApp"
        className="fixed bottom-5 right-5 z-50 rounded-full bg-green-500 p-3 text-white shadow-lg transition hover:bg-green-600 md:bottom-8 md:right-8 md:p-4"
      >
        <MessageCircle className="h-7 w-7 md:h-8 md:w-8" />
      </a>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">Meow my home</h3>
              <p>Shelter hewan terpercaya di Bandung</p>
              <p className="mt-2">Jl. Bekalivron No. 25, Bandung</p>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-4">Jam Operasional</h3>
              <p>Senin - Minggu : 09:00 - 18:00</p>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-4">Kontak</h3>
              <p>WhatsApp: 088801874579</p>
              <p>Email: meowmyhome@gmail.com</p>
            </div>
          </div>
          <div className="text-center mt-8 pt-4 border-t border-white/30">
            <p>&copy; 2026 Meow my home. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
