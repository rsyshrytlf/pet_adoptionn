import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock, Mail, MapPin, Phone, AlertCircle, CheckCircle } from 'lucide-react';

const commonEmailTypoDomains: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
};

const validateEmail = (email: string) => {
  const value = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailPattern.test(value)) {
    return 'Format email belum valid. Contoh: nama@gmail.com';
  }

  const domain = value.split('@')[1];
  if (!domain || !domain.includes('.')) {
    return 'Domain email belum lengkap.';
  }

  if (commonEmailTypoDomains[domain]) {
    return `Mungkin maksud Anda ${value.split('@')[0]}@${commonEmailTypoDomains[domain]}?`;
  }

  return '';
};

const validateAddress = (address: string) => {
  const value = address.trim();
  const lower = value.toLowerCase();
  const hasStreetHint = /\b(jl|jalan|gang|gg|no|nomor|rt|rw|blok|komplek|perum|desa|kelurahan|kecamatan)\b/.test(lower);
  const hasCityOrPostalCode = /\b(bandung|cimahi|kabupaten|kota)\b/.test(lower) || /\b\d{5}\b/.test(value);

  if (value.length < 20) {
    return 'Alamat terlalu pendek. Tulis jalan/gang, nomor rumah, kota, dan kode pos jika ada.';
  }

  if (!hasStreetHint) {
    return 'Alamat perlu memuat detail seperti Jalan/Jl, Gang, No, RT/RW, atau nama komplek.';
  }

  if (!hasCityOrPostalCode) {
    return 'Tambahkan kota atau kode pos agar alamat lebih mudah dicek.';
  }

  return '';
};

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; address?: string }>({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === 'email' || name === 'address') {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.address || !formData.phone) {
      setError('Semua field harus diisi');
      return;
    }

    const emailError = validateEmail(formData.email);
    const addressError = validateAddress(formData.address);

    if (emailError || addressError) {
      setFieldErrors({ email: emailError || undefined, address: addressError || undefined });
      setError(emailError || addressError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.address,
      formData.phone
    );

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registrasi gagal');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-none bg-gradient-to-br from-pink-50 to-purple-50">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <CardTitle className="text-3xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent pb-1">
              Daftar Akun Baru
            </CardTitle>
            <CardDescription>
              Isi form berikut untuk membuat akun dan mulai adopsi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User size={18} />
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nama lengkap Anda"
                    value={formData.name}
                    onChange={handleChange}
                    className="border-purple-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail size={18} />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => setFieldErrors(prev => ({ ...prev, email: validateEmail(formData.email) || undefined }))}
                    className={`border-purple-300 focus:border-purple-500 ${fieldErrors.email ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.email ? (
                    <p className="text-xs text-red-600">{fieldErrors.email}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Gunakan email aktif dengan domain yang benar.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone size={18} />
                  No WhatsApp Aktif <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border-purple-300 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin size={18} />
                  Alamat Lengkap <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Alamat lengkap termasuk kota dan kode pos"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={() => setFieldErrors(prev => ({ ...prev, address: validateAddress(formData.address) || undefined }))}
                  className={`w-full min-h-[100px] px-3 py-2 border border-purple-300 rounded-md focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${fieldErrors.address ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
                />
                {fieldErrors.address ? (
                  <p className="text-xs text-red-600">{fieldErrors.address}</p>
                ) : (
                  <p className="text-xs text-gray-500">Contoh: Jl. Melati No. 10, Kecamatan Coblong, Bandung 40132.</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock size={18} />
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="border-purple-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <CheckCircle size={18} />
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Ketik ulang password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="border-purple-300 focus:border-purple-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                size="lg"
              >
                Daftar Sekarang
              </Button>

              <div className="text-center">
                <p className="text-gray-600">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Login di sini
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
