import { Pet, Product, GroomingPackage } from '../types';

export const mockPets: Pet[] = [
  // Kucing
  {
    id: 'cat-1',
    name: 'Mimi',
    type: 'kucing',
    breed: 'Persia',
    gender: 'betina',
    age: '2 bulan',
    description: 'Halo nama ku Mimi, aku jenis kucing Persia',
    personality: 'Aku masih belajar berjalan dan senang jika digendong',
    favoriteFood: 'Buah-buahan',
    favoriteToy: 'Boneka semangka',
    health: 'Badan ku sehat, tidak ada riwayat sakit',
    rescueStory: 'Aku diadopsi saat umur 1 bulan di jalanan',
    suitableFor: 'Pemilik yang sabar dan santai di rumah',
    images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006', 'https://images.unsplash.com/photo-1573865526739-10c1dd7aa41c', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d'],
    status: 'available'
  },
  {
    id: 'cat-2',
    name: 'Luna',
    type: 'kucing',
    breed: 'Anggora',
    gender: 'betina',
    age: '4 bulan',
    description: 'Hai, aku Luna si cantik berbulu putih',
    personality: 'Aku sangat aktif dan suka bermain dengan bola',
    favoriteFood: 'Ikan tuna',
    favoriteToy: 'Bola benang',
    health: 'Sudah vaksin lengkap dan sehat',
    rescueStory: 'Aku ditinggalkan di depan shelter dalam keadaan basah kuyup',
    suitableFor: 'Keluarga dengan anak-anak yang aktif',
    images: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131', 'https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6'],
    status: 'available'
  },
  {
    id: 'cat-3',
    name: 'Simba',
    type: 'kucing',
    breed: 'Kucing Kampung',
    gender: 'jantan',
    age: '6 bulan',
    description: 'Namaku Simba, aku pemberani seperti singa',
    personality: 'Aku sangat ramah dan mudah bergaul dengan kucing lain',
    favoriteFood: 'Ayam rebus',
    favoriteToy: 'Teaser stick',
    health: 'Sangat sehat dan energik',
    rescueStory: 'Aku diselamatkan dari tempat sampah saat masih kecil',
    suitableFor: 'Orang yang sudah berpengalaman merawat kucing',
    images: ['https://images.unsplash.com/photo-1511044568932-338cba0ad803', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'],
    status: 'available'
  },

  // Anjing
  {
    id: 'dog-1',
    name: 'Max',
    type: 'anjing',
    breed: 'Golden Retriever',
    gender: 'jantan',
    age: '3 bulan',
    description: 'Halo! Namaku Max, aku anjing yang ramah dan penurut',
    personality: 'Aku sangat setia dan suka bermain lempar tangkap',
    favoriteFood: 'Dog food premium dan wortel',
    favoriteToy: 'Bola tenis',
    health: 'Sudah divaksin dan dalam kondisi prima',
    rescueStory: 'Aku diserahkan ke shelter karena pemilik lama pindah ke luar negeri',
    suitableFor: 'Keluarga dengan halaman luas dan aktif',
    images: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1', 'https://images.unsplash.com/photo-1558788353-f76d92427f16'],
    status: 'available'
  },
  {
    id: 'dog-2',
    name: 'Bella',
    type: 'anjing',
    breed: 'Beagle',
    gender: 'betina',
    age: '5 bulan',
    description: 'Nama ku Bella, aku ceria dan selalu bahagia',
    personality: 'Sangat friendly dan mudah dilatih',
    favoriteFood: 'Daging ayam',
    favoriteToy: 'Frisbee',
    health: 'Sehat, cek kesehatan rutin dilakukan',
    rescueStory: 'Aku ditemukan tersesat di taman kota',
    suitableFor: 'Pemilik yang suka jogging dan aktivitas outdoor',
    images: ['https://images.unsplash.com/photo-1505628346881-b72b27e84530', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1', 'https://images.unsplash.com/photo-1517849845537-4d257902454a'],
    status: 'available'
  },
  {
    id: 'dog-3',
    name: 'Rocky',
    type: 'anjing',
    breed: 'Bulldog',
    gender: 'jantan',
    age: '8 bulan',
    description: 'Hi, aku Rocky! Tampangku garang tapi hatiku lembut',
    personality: 'Tenang, santai, dan suka tidur',
    favoriteFood: 'Snack tulang',
    favoriteToy: 'Boneka squeaky',
    health: 'Sangat sehat dan kuat',
    rescueStory: 'Aku diselamatkan dari breeding ilegal',
    suitableFor: 'Pemilik yang suka di rumah dan santai',
    images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e', 'https://images.unsplash.com/photo-1583511666407-5f06533f2113', 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8'],
    status: 'available'
  }
];

export const mockProducts: Product[] = [
  // Baju
  { id: 'prod-1', name: 'Baju Kucing Lucu Pink', category: 'baju', description: 'Baju dengan motif lucu untuk kucing kesayangan', price: 45000, image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42', stock: 15 },
  { id: 'prod-2', name: 'Sweater Anjing Hangat', category: 'baju', description: 'Sweater tebal untuk anjing di musim hujan', price: 75000, image: 'https://images.unsplash.com/photo-1583511655826-05700d6f1f1d', stock: 10 },

  // Aksesoris
  { id: 'prod-3', name: 'Kalung Lucu Lonceng', category: 'aksesoris', description: 'Kalung dengan lonceng untuk hewan peliharaan', price: 25000, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7', stock: 25 },
  { id: 'prod-4', name: 'Pita Cantik', category: 'aksesoris', description: 'Pita hias untuk kucing dan anjing', price: 15000, image: 'https://images.unsplash.com/photo-1581888227599-779811939961', stock: 30 },

  // Makanan
  { id: 'prod-5', name: 'Royal Canin Kitten 1kg', category: 'makanan', description: 'Makanan premium untuk anak kucing', price: 125000, image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119', stock: 20 },
  { id: 'prod-6', name: 'Dog Food Premium 2kg', category: 'makanan', description: 'Makanan anjing dengan nutrisi lengkap', price: 150000, image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95', stock: 15 },

  // Snack
  { id: 'prod-8', name: 'Snack Kucing Tuna', category: 'snack', description: 'Snack rasa tuna yang disukai kucing', price: 20000, image: 'https://images.unsplash.com/photo-1548048026-5a1a941d93d3', stock: 40 },
  { id: 'prod-9', name: 'Biskuit Anjing', category: 'snack', description: 'Biskuit sehat untuk anjing', price: 30000, image: 'https://images.unsplash.com/photo-1628407284695-d3c9fe1d79c1', stock: 35 },

  // Pasir
  { id: 'prod-10', name: 'Pasir Kucing Gumpal 5L', category: 'pasir', description: 'Pasir kucing yang mudah dibersihkan', price: 45000, image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f', stock: 30 },

  // Alat Makan
  { id: 'prod-11', name: 'Mangkuk Makan Stainless', category: 'alat-makan', description: 'Mangkuk anti karat untuk makanan', price: 35000, image: 'https://images.unsplash.com/photo-1591768575042-c7c2e0a43363', stock: 20 },
  { id: 'prod-12', name: 'Feeder Otomatis', category: 'alat-makan', description: 'Tempat makan otomatis dengan timer', price: 180000, image: 'https://images.unsplash.com/photo-1544435253-f0ead49638fa', stock: 8 },

  // Alat Minum
  { id: 'prod-13', name: 'Fountain Air Minum', category: 'alat-minum', description: 'Air mancur untuk hewan peliharaan', price: 150000, image: 'https://images.unsplash.com/photo-1563225408-d0e2b6e2b90b', stock: 10 },

  // Kandang
  { id: 'prod-14', name: 'Kandang Kucing Besar', category: 'kandang', description: 'Kandang luas dengan 3 tingkat', price: 850000, image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987', stock: 5 },

  // Alat Tidur
  { id: 'prod-16', name: 'Kasur Empuk Kucing', category: 'alat-tidur', description: 'Kasur lembut dan nyaman', price: 95000, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb', stock: 15 },
  { id: 'prod-17', name: 'Rumah Kucing Tertutup', category: 'alat-tidur', description: 'Rumah kucing dengan privacy', price: 175000, image: 'https://images.unsplash.com/photo-1591871937573-74dbba515c4c', stock: 12 }
];

export const mockGroomingPackages: GroomingPackage[] = [
  {
    id: 'groom-a',
    name: 'Paket A - Basic Care',
    services: ['Mandi', 'Sisir Bulu', 'Potong Kuku'],
    price: 250000,
    duration: '1.5 jam',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb'
  },
  {
    id: 'groom-b',
    name: 'Paket B - Standard Grooming',
    services: ['Mandi', 'Sisir Bulu', 'Potong Kuku', 'Pembersihan Telinga', 'Sikat Gigi'],
    price: 350000,
    duration: '2 jam',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
  },
  {
    id: 'groom-c',
    name: 'Paket C - Premium Spa',
    services: ['Mandi', 'Sisir Bulu', 'Potong Kuku', 'Pembersihan Telinga', 'Sikat Gigi', 'Hair Cut Styling', 'Aromatherapy'],
    price: 500000,
    duration: '3 jam',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b'
  },
  {
    id: 'groom-d',
    name: 'Paket D - Luxury Treatment',
    services: ['Mandi', 'Sisir Bulu', 'Potong Kuku', 'Pembersihan Telinga', 'Sikat Gigi', 'Hair Cut Styling', 'Aromatherapy', 'Massage', 'Pedicure', 'Parfum'],
    price: 750000,
    duration: '4 jam',
    image: 'https://images.unsplash.com/photo-1581888227599-779811939961'
  }
];
