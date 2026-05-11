import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Lock, AlertCircle } from 'lucide-react';

export default function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    const success = await loginAdmin(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-none bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent pb-1">
              Login Admin
            </CardTitle>
            <CardDescription>
              Akses khusus untuk administrator
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

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Shield size={18} />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@meowmyhome.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-blue-300 focus:border-blue-500"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-blue-300 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                size="lg"
              >
                Masuk sebagai Admin
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  ← Kembali ke Login User
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
