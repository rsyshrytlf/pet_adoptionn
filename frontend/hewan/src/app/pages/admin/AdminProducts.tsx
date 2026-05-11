import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertTriangle, Pencil, Trash2, Plus, Loader2, ImagePlus, Search } from 'lucide-react';
import { getShopProducts, createShopProduct, updateShopProduct, deleteShopProduct, uploadImage } from '../../services/api';
import { useModalAlert } from '../../components/ui/modal-alert';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';

interface ShopProduct {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}

const emptyForm = { name: '', category: 'makanan', description: '', price: 0, image: '', stock: 0 };

const categories = [
  { id: 'baju', name: 'Baju' }, { id: 'aksesoris', name: 'Aksesoris' },
  { id: 'makanan', name: 'Makanan' }, { id: 'snack', name: 'Snack' },
  { id: 'pasir', name: 'Pasir' }, { id: 'alat-makan', name: 'Alat Makan' },
  { id: 'alat-minum', name: 'Alat Minum' }, { id: 'kandang', name: 'Kandang' },
  { id: 'alat-tidur', name: 'Alat Tidur' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [priceDisplay, setPriceDisplay] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert, showConfirm, Modal } = useModalAlert();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    setFormData(prev => ({ ...prev, price: num }));
    setPriceDisplay(raw === '' ? '' : num.toLocaleString('id-ID'));
  };

  useEffect(() => { loadProducts(); }, []);
  useLiveRefresh(() => loadProducts(true), ['products'], 7000, []);

  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getShopProducts();
      setProducts(data);
    } catch {
      showAlert('Gagal memuat data produk. Pastikan server berjalan.', 'error', 'Koneksi Error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleEdit = (product: ShopProduct) => {
    setEditingProduct(product);
    const priceVal = product.price || 0;
    setFormData({ name: product.name, category: product.category, description: product.description || '', price: priceVal, image: product.image || '', stock: product.stock });
    setPriceDisplay(priceVal > 0 ? priceVal.toLocaleString('id-ID') : '');
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    showConfirm(
      'Yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan.',
      async () => {
        try {
          await deleteShopProduct(id);
          setProducts(products.filter(p => p.id !== id));
          showAlert('Produk berhasil dihapus.', 'success', 'Berhasil');
        } catch {
          showAlert('Gagal menghapus produk.', 'error', 'Error');
        }
      },
      'Hapus Produk?', 'Ya, Hapus', 'Batal',
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: url }));
      showAlert('Gambar berhasil diupload!', 'success', 'Upload Berhasil');
    } catch (e: any) {
      showAlert(e.message || 'Gagal upload gambar', 'error', 'Upload Gagal');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.price <= 0) {
      showAlert('Nama dan harga harus diisi dengan benar.', 'warning', 'Validasi');
      return;
    }
    const payload = { ...formData, image: formData.image || 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400' };
    setSaving(true);
    try {
      if (editingProduct) {
        const res = await updateShopProduct(editingProduct.id, payload);
        setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
        showAlert('Produk berhasil diupdate!', 'success', 'Berhasil');
      } else {
        const res = await createShopProduct(payload);
        setProducts([res.data, ...products]);
        showAlert('Produk baru berhasil ditambahkan!', 'success', 'Berhasil');
      }
      closeDialog();
    } catch (e: any) {
      showAlert(e.message || 'Gagal menyimpan produk', 'error', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setFormData({ ...emptyForm });
    setPriceDisplay('');
  };

  const normalize = (value: unknown) => String(value ?? '').toLowerCase();

  const filteredProducts = products.filter(product => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    const categoryName = categories.find(category => category.id === product.category)?.name || product.category;
    const stockStatus = product.stock <= 0 ? 'stok habis kosong' : 'stok tersedia';
    const searchableText = [
      product.name,
      product.category,
      categoryName,
      product.description,
      product.price,
      product.stock,
      stockStatus,
    ].map(normalize).join(' ');

    return searchableText.includes(keyword);
  });

  return (
    <div className="space-y-6">
      {Modal}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Kelola Produk</CardTitle>
            <Button onClick={() => { setEditingProduct(null); setFormData({ ...emptyForm }); setShowDialog(true); }} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="mr-2" size={18} /> Tambah Produk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Cari nama produk, kategori, deskripsi, harga, atau stok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="bg-gradient-to-br from-white to-blue-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-200">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400'; }} />
                    </div>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{product.category}</p>
                        </div>
                        {product.stock <= 0 && (
                          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                            product.stock < 0
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                            <AlertTriangle size={12} />
                            {product.stock < 0 ? 'Stok Bermasalah' : 'Stok Habis'}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-blue-600 mt-2">Rp {product.price.toLocaleString('id-ID')}</p>
                      <p className={`text-sm font-semibold ${
                        product.stock < 0 ? 'text-red-600' : product.stock === 0 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        Stok: {product.stock}
                      </p>
                      {product.stock <= 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tidak tampil di halaman belanja user.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(product)}><Pencil size={16} className="mr-1" />Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {products.length === 0 ? 'Belum ada produk yang ditambahkan' : 'Produk tidak ditemukan'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Produk *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Harga (Rp) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    placeholder="Contoh: 50.000"
                    className="pl-10"
                  />
                </div>
                {formData.price > 0 && (
                  <p className="text-xs text-green-600">= Rp {formData.price.toLocaleString('id-ID')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Stok *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formData.stock === 0 ? '' : String(formData.stock)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, stock: raw === '' ? 0 : parseInt(raw, 10) }));
                  }}
                  placeholder="Jumlah stok"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md min-h-[80px]" />
            </div>

            {/* Upload Gambar */}
            <div className="space-y-2">
              <Label>Foto Produk</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                {uploadingImg ? (
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                ) : formData.image ? (
                  <img src={formData.image} alt="" className="h-24 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <ImagePlus size={28} className="text-blue-400" />
                )}
                <p className="text-sm text-blue-600 font-medium">
                  {uploadingImg ? 'Mengupload...' : formData.image ? 'Klik untuk ganti foto' : 'Klik untuk upload foto'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP maks. 5MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving || uploadingImg} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 mt-4">
            {saving ? <><Loader2 className="animate-spin mr-2" size={18} />Menyimpan...</> : (editingProduct ? 'Update Produk' : 'Tambah Produk')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
