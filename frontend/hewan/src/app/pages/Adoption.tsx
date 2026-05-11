import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Heart, Eye, Loader2, Search, X } from 'lucide-react';
import { getPets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh } from '../hooks/useLiveRefresh';

interface Pet {
  id: number;
  name: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  description: string;
  images: string[];
  status: string;
  price: number;
}

export default function Adoption() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'kucing' | 'anjing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [navigatingAction, setNavigatingAction] = useState<'detail' | 'adopt' | null>(null);

  const goTo = (petId: number, action: 'detail' | 'adopt') => {
    if (navigatingId !== null) return; // cegah klik ganda
    setNavigatingId(petId);
    setNavigatingAction(action);
    if (action === 'adopt') {
      navigate(`/adopsi/${petId}`, { state: { autoAdopt: true } });
    } else {
      navigate(`/adopsi/${petId}`);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [selectedType]);

  useLiveRefresh(() => fetchPets(true), ['pets'], 7000, [selectedType]);

  const fetchPets = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getPets(selectedType);
      // Hanya tampilkan hewan yang tersedia (available)
      // Hewan yang booked / adopted disembunyikan dari user lain
      const onlyAvailable = data.filter((p: Pet) => p.status === 'available');
      setPets(onlyAvailable);
    } catch (e) {
      setError('Gagal memuat data hewan. Pastikan server backend berjalan.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      available: { label: 'Tersedia',  className: 'bg-green-500' },
      booked:    { label: 'Dipesan',   className: 'bg-yellow-500' },
      adopted:   { label: 'Diadopsi', className: 'bg-gray-500' },
    };
    const s = map[status] ?? { label: status, className: 'bg-blue-500' };
    return <Badge className={`${s.className} text-white`}>{s.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { kucing: '🐱', anjing: '🐶' };
    return icons[type] ?? '🐾';
  };

  const filteredPets = pets.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 pb-2 sm:text-4xl md:text-5xl"
        >
          Adopsi Hewan
        </motion.h1>
        <p className="text-xl text-gray-700">Temukan teman berbulu impianmu dan beri mereka rumah yang penuh kasih</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, ras, atau jenis hewan..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none bg-white text-gray-700 shadow-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Menampilkan <strong>{filteredPets.length}</strong> hasil untuk "<em>{searchQuery}</em>"
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 justify-center flex-wrap">
        {[
          { id: 'all',     label: 'Semua', icon: '🐾' },
          { id: 'kucing',  label: 'Kucing', icon: '🐱' },
          { id: 'anjing',  label: 'Anjing', icon: '🐶' },
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setSelectedType(tab.id as any)}
            variant={selectedType === tab.id ? 'default' : 'outline'}
            className={selectedType === tab.id ? 'bg-gradient-to-r from-pink-500 to-purple-500' : ''}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 className="animate-spin text-purple-500" size={48} />
          <p className="text-gray-500">Memuat data hewan...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16 bg-red-50 rounded-xl">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold">{error}</p>
          <Button onClick={fetchPets} className="mt-4 bg-pink-500">Coba Lagi</Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredPets.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🐾</div>
          <p className="text-xl text-gray-600">Belum ada hewan yang tersedia saat ini</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filteredPets.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPets.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-none bg-white">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={Array.isArray(pet.images) ? pet.images[0] : pet.images}
                    alt={pet.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600';
                    }}
                  />
                  <div className="absolute top-4 right-4">{getStatusBadge(pet.status)}</div>
                  <div className="absolute top-4 left-4 text-4xl bg-white rounded-full p-2">
                    {getTypeIcon(pet.type)}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-purple-700 mb-2">{pet.name}</h3>
                  <p className="text-pink-600 font-bold text-lg mb-2">
                    {pet.breed} • {pet.gender} • {pet.age}
                  </p>
                  {/* Harga */}
                  <div className="mb-3">
                    {pet.price && pet.price > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 font-bold text-base px-3 py-1 rounded-full">
                        💰 Rp {Number(pet.price).toLocaleString('id-ID')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 font-bold text-base px-3 py-1 rounded-full">
                        🎁 Gratis
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pet.description}</p>

                  {pet.status === 'available' ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => goTo(pet.id, 'detail')}
                        disabled={navigatingId === pet.id}
                      >
                        {navigatingId === pet.id && navigatingAction === 'detail' ? (
                          <><Loader2 className="mr-2 animate-spin" size={18} /> Membuka...</>
                        ) : (
                          <><Eye className="mr-2" size={18} /> Lihat Detail</>
                        )}
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                        onClick={() => goTo(pet.id, 'adopt')}
                        disabled={navigatingId === pet.id}
                      >
                        {navigatingId === pet.id && navigatingAction === 'adopt' ? (
                          <><Loader2 className="mr-2 animate-spin" size={18} /> Membuka...</>
                        ) : (
                          <><Heart className="mr-2" size={18} /> Adopsi</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button disabled className="w-full">
                      {pet.status === 'adopted' ? 'Sudah Diadopsi' : 'Sedang Dipesan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
