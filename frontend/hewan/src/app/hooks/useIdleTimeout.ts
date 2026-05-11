import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router';

// Batas waktu idle: 30 Menit (dalam milidetik)
const IDLE_TIMEOUT = 30 * 60 * 1000;

export const useIdleTimeout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Hanya pantau jika user sedang login
    if (!isAuthenticated) return;

    const handleIdle = () => {
      logout();
      // Menggunakan alert bawaan browser
      alert('Sesi Berakhir: Anda telah otomatis di-logout karena tidak ada aktivitas selama 30 menit. Silakan Login Kembali.');
      navigate('/login');
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT);
    };

    // Daftar event yang menandakan aktivitas
    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];

    const attachListeners = () => {
      events.forEach(event => window.addEventListener(event, resetTimer));
    };

    const detachListeners = () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    attachListeners();
    resetTimer(); // Mulai timer saat komponen dimount

    return () => {
      detachListeners();
    };
  }, [isAuthenticated, logout, navigate, location.pathname]);
};
