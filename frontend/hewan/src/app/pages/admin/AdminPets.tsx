import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Pencil, Trash2, Plus, Loader2, Upload, X, ImagePlus } from 'lucide-react';
import { getPets, createPet, updatePet, deletePet } from '../../services/api';
import { uploadImage } from '../../services/api';
import { useModalAlert } from '../../components/ui/modal-alert';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';

interface Pet {
  id: number;
  name: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  description: string;
  personality: string;
  favorite_food: string;
  favorite_toy: string;
  health: string;
  rescue_story: string;
  suitable_for: string;
  images: string[];
  status: string;
  price: number;
}

const emptyForm = {
  name: '', type: 'kucing', breed: '', gender: 'jantan', age: '',
  description: '', personality: '', favorite_food: '', favorite_toy: '',
  health: '', rescue_story: '', suitable_for: '',
  images: [] as string[], status: 'available', price: 0,
};

export default function AdminPets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [priceDisplay, setPriceDisplay] = useState('0');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'booked' | 'adopted'>('all');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert, showConfirm, Modal } = useModalAlert();

  // Format angka ke format Rupiah (hanya titik, tanpa Rp)
  const formatRupiah = (val: number) =>
    val === 0 ? '' : val.toLocaleString('id-ID');

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hapus semua non-digit
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    setFormData(prev => ({ ...prev, price: num }));
    setPriceDisplay(raw === '' ? '' : num.toLocaleString('id-ID'));
  };

  useEffect(() => { loadPets(); }, []);
  useLiveRefresh(() => loadPets(true), ['pets'], 7000, []);

  const loadPets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getPets();
      setPets(data);
    } catch {
      showAlert('Gagal memuat data hewan. Pastikan server berjalan.', 'error', 'Koneksi Error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    const imgs = Array.isArray(pet.images) ? pet.images : [];
    const priceVal = pet.price || 0;
    setFormData({
      name: pet.name, type: pet.type, breed: pet.breed, gender: pet.gender,
      age: pet.age, description: pet.description || '', personality: pet.personality || '',
      favorite_food: pet.favorite_food || '', favorite_toy: pet.favorite_toy || '',
      health: pet.health || '', rescue_story: pet.rescue_story || '',
      suitable_for: pet.suitable_for || '', images: imgs,
      status: pet.status, price: priceVal,
    });
    setPriceDisplay(priceVal > 0 ? priceVal.toLocaleString('id-ID') : '');
    setPreviewImages(imgs);
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    showConfirm(
      'Yakin ingin menghapus hewan ini? Tindakan ini tidak bisa dibatalkan.',
      async () => {
        try {
          await deletePet(id);
          setPets(pets.filter(p => p.id !== id));
          showAlert('Hewan berhasil dihapus.', 'success', 'Berhasil');
        } catch {
          showAlert('Gagal menghapus hewan.', 'error', 'Error');
        }
      },
      'Hapus Hewan?',
      'Ya, Hapus',
      'Batal',
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImg(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }
      const newImages = [...(formData.images || []), ...uploadedUrls];
      setFormData(prev => ({ ...prev, images: newImages }));
      setPreviewImages(newImages);
      showAlert(`${files.length} gambar berhasil diupload!`, 'success', 'Upload Berhasil');
    } catch (e: any) {
      showAlert(e.message || 'Gagal upload gambar', 'error', 'Upload Gagal');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    setPreviewImages(newImages);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.breed) {
      showAlert('Nama dan ras harus diisi.', 'warning', 'Validasi');
      return;
    }

    const payload = {
      ...formData,
      images: formData.images.length > 0
        ? formData.images
        : ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'],
    };

    setSaving(true);
    try {
      if (editingPet) {
        const res = await updatePet(editingPet.id, payload);
        setPets(pets.map(p => p.id === editingPet.id ? res.data : p));
        showAlert('Data hewan berhasil diupdate!', 'success', 'Berhasil');
      } else {
        const res = await createPet(payload);
        setPets([res.data, ...pets]);
        showAlert('Hewan baru berhasil ditambahkan!', 'success', 'Berhasil');
      }
      closeDialog();
    } catch (e: any) {
      showAlert(e.message || 'Gagal menyimpan data hewan', 'error', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingPet(null);
    setFormData({ ...emptyForm });
    setPriceDisplay('');
    setPreviewImages([]);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { available: 'bg-green-500', booked: 'bg-yellow-500', adopted: 'bg-gray-500' };
    const label: Record<string, string> = { available: 'Tersedia', booked: 'Dipesan', adopted: 'Diadopsi' };
    return <Badge className={`${map[status] ?? 'bg-blue-500'} text-white`}>{label[status] ?? status}</Badge>;
  };

  const filteredPets = statusFilter === 'all'
    ? pets
    : pets.filter(pet => pet.status === statusFilter);

  return (
    <div className="space-y-6">
      {Modal}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl">Kelola Hewan</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | 'available' | 'booked' | 'adopted')}
                className="h-9 w-full rounded-md border border-blue-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-56"
              >
                <option value="all">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="booked">Dipesan</option>
                <option value="adopted">Diadopsi</option>
              </select>
              <Button
                onClick={() => { setEditingPet(null); setFormData({ ...emptyForm }); setPreviewImages([]); setShowDialog(true); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Plus className="mr-2" size={18} /> Tambah Hewan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          ) : (
            <div className="space-y-4">
              {filteredPets.map(pet => (
                <Card key={pet.id} className="bg-gradient-to-br from-white to-blue-50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={Array.isArray(pet.images) ? pet.images[0] : pet.images}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200'; }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{pet.name}</h3>
                            <p className="text-sm text-gray-600">{pet.type} • {pet.breed} • {pet.age}</p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              {getStatusBadge(pet.status)}
                              {pet.price && pet.price > 0 ? (
                                <span className="text-sm font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                  Rp {Number(pet.price).toLocaleString('id-ID')}
                                </span>
                              ) : (
                                <span className="text-sm font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                  Gratis
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(pet)}><Pencil size={16} /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(pet.id)}><Trash2 size={16} /></Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{pet.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {pets.length === 0 ? 'Belum ada hewan yang ditambahkan' : 'Tidak ada hewan dengan status ini'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPet ? 'Edit Hewan' : 'Tambah Hewan Baru'}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama hewan" />
            </div>
            <div className="space-y-2">
              <Label>Jenis *</Label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="kucing">Kucing</option>
                <option value="anjing">Anjing</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ras/Breed *</Label>
              <Input value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })} placeholder="Persia, Golden Retriever, dll" />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="jantan">Jantan</option>
                <option value="betina">Betina</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Umur *</Label>
              <Input value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="Contoh: 2 bulan, 1 tahun" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="available">Tersedia</option>
                <option value="booked">Dipesan</option>
                <option value="adopted">Diadopsi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Harga Adopsi (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  placeholder="Contoh: 500.000"
                  className="pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {formData.price > 0 && (
                <p className="text-xs text-green-600">= Rp {formData.price.toLocaleString('id-ID')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Kepribadian</Label>
              <Input value={formData.personality} onChange={e => setFormData({ ...formData, personality: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Makanan Favorit</Label>
              <Input value={formData.favorite_food} onChange={e => setFormData({ ...formData, favorite_food: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mainan Favorit</Label>
              <Input value={formData.favorite_toy} onChange={e => setFormData({ ...formData, favorite_toy: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Deskripsi</Label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md min-h-[80px]" placeholder="Halo nama ku..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Kesehatan</Label>
              <Input value={formData.health} onChange={e => setFormData({ ...formData, health: e.target.value })} placeholder="Riwayat vaksin, kondisi kesehatan" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cerita Penyelamatan</Label>
              <textarea value={formData.rescue_story} onChange={e => setFormData({ ...formData, rescue_story: e.target.value })} className="w-full px-3 py-2 border rounded-md min-h-[60px]" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cocok Untuk</Label>
              <Input value={formData.suitable_for} onChange={e => setFormData({ ...formData, suitable_for: e.target.value })} placeholder="Keluarga dengan anak-anak, pemilik aktif, dll" />
            </div>

            {/* Upload Gambar */}
            <div className="space-y-3 md:col-span-2">
              <Label>Foto Hewan</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                {uploadingImg ? (
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                ) : (
                  <ImagePlus size={32} className="text-blue-400" />
                )}
                <p className="text-sm text-blue-600 font-medium">
                  {uploadingImg ? 'Mengupload gambar...' : 'Klik untuk upload foto'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP maks. 5MB (bisa multiple)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Preview grid */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {previewImages.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving || uploadingImg} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 mt-4">
            {saving ? <><Loader2 className="animate-spin mr-2" size={18} />Menyimpan...</> : (editingPet ? 'Update Hewan' : 'Tambah Hewan')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
