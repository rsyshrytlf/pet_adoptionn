import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { requestPasswordOtp, resetPasswordWithOtp } from '../services/api';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, KeyRound, Lock, Mail, AlertCircle, PawPrint, User } from 'lucide-react';

export default function Login() {
  // mode menentukan form yang sedang tampil:
  // 'login' = form masuk, 'forgot' = form minta OTP, 'reset' = form ganti password.
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');

  // State untuk input login biasa.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State khusus alur lupa password/OTP.
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State pesan UI: error untuk gagal, success untuk berhasil, loading untuk tombol proses.
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAdmin } = useAuth();
  const navigate = useNavigate();

  // Fungsi login utama. Admin dicoba dulu, setelah itu user biasa.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Email dan password harus diisi');
      setLoading(false);
      return;
    }

    const adminSuccess = await loginAdmin(email, password);
    if (adminSuccess) {
      navigate('/admin');
      return;
    }

    const userSuccess = await login(email, password);
    if (userSuccess) {
      navigate('/');
    } else {
      setError('Email atau password salah');
    }

    setLoading(false);
  };

  // Fungsi ini mengirim OTP ke email yang dimasukkan di form lupa password.
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetEmail) {
      setError('Email harus diisi');
      return;
    }

    setLoading(true);

    try {
      await requestPasswordOtp(resetEmail.trim());
      setSuccess('Kode OTP sudah dikirim. Silakan cek email kamu.');
      setMode('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim kode OTP');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi ini memvalidasi OTP dan menyimpan password baru.
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetEmail || !otp || !newPassword || !confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sama');
      return;
    }

    setLoading(true);

    try {
      const data = await resetPasswordWithOtp({
        email: resetEmail.trim(),
        otp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setEmail(resetEmail.trim());
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
      setSuccess(data.message || 'Password berhasil direset. Silakan login.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  // Mengembalikan tampilan ke form login dan membersihkan pesan.
  const showLoginMode = () => {
    setMode('login');
    setError('');
    setSuccess('');
  };

  // Title dan description berubah otomatis sesuai mode form.
  const title = mode === 'login' ? 'Masuk' : mode === 'forgot' ? 'Lupa Password' : 'Reset Password';
  const description = mode === 'login'
    ? 'Masuk sebagai user atau admin sesuai akun kamu'
    : mode === 'forgot'
      ? 'Masukkan email akun kamu untuk menerima kode OTP'
      : 'Masukkan kode OTP dan password baru kamu';

  return (
    // Ubah posisi card login dari class di bawah:
    // justify-center = tengah horizontal, items-center = tengah vertical, min-h-[80vh] = tinggi area.
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        // max-w-md mengatur lebar card. Ganti ke max-w-lg kalau mau lebih lebar.
        className="w-full max-w-md"
      >
        {/* Ubah warna background card dari class from-pink-50 dan to-purple-50. */}
        <Card className="shadow-2xl border-none bg-gradient-to-br from-pink-50 to-purple-50">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              {/* Ubah ukuran icon dari w-16 h-16, dan warna bulatan dari from-pink-500/to-purple-600. */}
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <PawPrint size={32} className="text-white" />
              </div>
            </motion.div>
            {/* Ubah warna judul dari from-pink-600/to-purple-600. */}
            <CardTitle className="text-3xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent pb-1">
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={mode === 'login' ? handleSubmit : mode === 'forgot' ? handleForgotPassword : handleResetPassword}
              // space-y-6 mengatur jarak antar input. Kecilkan ke space-y-4 kalau mau lebih rapat.
              className="space-y-6"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  // Warna alert error bisa diubah dari bg-red-100/border-red-400/text-red-700.
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2"
                >
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  // Warna alert sukses bisa diubah dari bg-green-100/border-green-400/text-green-700.
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
                >
                  {success}
                </motion.div>
              )}

              {mode === 'login' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <User size={18} />
                      Email
                    </Label>
                    {/* Ubah warna border input dari border-purple-300 dan focus:border-purple-500. */}
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-purple-300 focus:border-purple-500"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock size={18} />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-purple-300 focus:border-purple-500"
                      disabled={loading}
                    />
                    {/* Ubah warna link lupa password dari text-purple-600 dan hover:text-purple-700. */}
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setMode('forgot');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                      disabled={loading}
                    >
                      Lupa password?
                    </button>
                  </div>
                </>
              )}

              {mode === 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail size={18} />
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="border-purple-300 focus:border-purple-500"
                    disabled={loading}
                  />
                </div>
              )}

              {mode === 'reset' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="flex items-center gap-2">
                      <KeyRound size={18} />
                      Kode OTP
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      // tracking-[0.4em] membuat angka OTP renggang. Kecilkan kalau mau lebih rapat.
                      className="border-purple-300 focus:border-purple-500 tracking-[0.4em]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="flex items-center gap-2">
                      <Lock size={18} />
                      Password Baru
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="********"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-purple-300 focus:border-purple-500"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center gap-2">
                      <Lock size={18} />
                      Konfirmasi Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-purple-300 focus:border-purple-500"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {/* Ubah warna tombol utama dari from-pink-500/to-purple-500 dan hover-nya. */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : mode === 'forgot' ? 'Kirim OTP' : 'Reset Password'}
              </Button>

              {mode !== 'login' && (
                // Tombol kembali ke form login.
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-purple-700 hover:text-purple-800"
                  onClick={showLoginMode}
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Kembali ke login
                </Button>
              )}

              {mode === 'login' && (
                <div className="text-center">
                  <p className="text-gray-600">
                    Belum punya akun?{' '}
                    <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                      Daftar di sini
                    </Link>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
