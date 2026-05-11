<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pet;
use App\Models\ShopProduct;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ==================== ADMIN ====================
        User::updateOrCreate(
            ['email' => 'admin@meowmyhome.com'],
            [
                'name' => 'Admin',
                'password' => 'admin123',
                'role' => 'admin'
            ]
        );

        // ==================== PETS ====================
        $pets = [
            // Kucing
            [
                'name'         => 'Mimi',
                'type'         => 'kucing',
                'breed'        => 'Persia',
                'gender'       => 'betina',
                'age'          => '2 bulan',
                'description'  => 'Halo nama ku Mimi, aku jenis kucing Persia',
                'personality'  => 'Aku masih belajar berjalan dan senang jika digendong',
                'favorite_food'=> 'Buah-buahan',
                'favorite_toy' => 'Boneka semangka',
                'health'       => 'Badan ku sehat, tidak ada riwayat sakit',
                'rescue_story' => 'Aku diadopsi saat umur 1 bulan di jalanan',
                'suitable_for' => 'Pemilik yang sabar dan santai di rumah',
                'images'       => json_encode([
                    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600',
                    'https://images.unsplash.com/photo-1573865526739-10c1dd7aa41c?w=600',
                    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600',
                ]),
                'status' => 'available',
                'price'  => 0,
            ],
            [
                'name'         => 'Luna',
                'type'         => 'kucing',
                'breed'        => 'Anggora',
                'gender'       => 'betina',
                'age'          => '4 bulan',
                'description'  => 'Hai, aku Luna si cantik berbulu putih',
                'personality'  => 'Aku sangat aktif dan suka bermain dengan bola',
                'favorite_food'=> 'Ikan tuna',
                'favorite_toy' => 'Bola benang',
                'health'       => 'Sudah vaksin lengkap dan sehat',
                'rescue_story' => 'Aku ditinggalkan di depan shelter dalam keadaan basah kuyup',
                'suitable_for' => 'Keluarga dengan anak-anak yang aktif',
                'images'       => json_encode([
                    'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600',
                    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600',
                    'https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6?w=600',
                ]),
                'status' => 'available',
                'price'  => 0,
            ],
            [
                'name'         => 'Simba',
                'type'         => 'kucing',
                'breed'        => 'Kucing Kampung',
                'gender'       => 'jantan',
                'age'          => '6 bulan',
                'description'  => 'Namaku Simba, aku pemberani seperti singa',
                'personality'  => 'Aku sangat ramah dan mudah bergaul dengan kucing lain',
                'favorite_food'=> 'Ayam rebus',
                'favorite_toy' => 'Teaser stick',
                'health'       => 'Sangat sehat dan energik',
                'rescue_story' => 'Aku diselamatkan dari tempat sampah saat masih kecil',
                'suitable_for' => 'Orang yang sudah berpengalaman merawat kucing',
                'images'       => json_encode([
                    'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=600',
                    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=600',
                    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
                ]),
                'status' => 'available',
                'price'  => 0,
            ],

            // Anjing
            [
                'name'         => 'Max',
                'type'         => 'anjing',
                'breed'        => 'Golden Retriever',
                'gender'       => 'jantan',
                'age'          => '3 bulan',
                'description'  => 'Halo! Namaku Max, aku anjing yang ramah dan penurut',
                'personality'  => 'Aku sangat setia dan suka bermain lempar tangkap',
                'favorite_food'=> 'Dog food premium dan wortel',
                'favorite_toy' => 'Bola tenis',
                'health'       => 'Sudah divaksin dan dalam kondisi prima',
                'rescue_story' => 'Aku diserahkan ke shelter karena pemilik lama pindah ke luar negeri',
                'suitable_for' => 'Keluarga dengan halaman luas dan aktif',
                'images'       => json_encode([
                    'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600',
                    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600',
                    'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600',
                ]),
                'status' => 'available',
                'price'  => 0,
            ],
            [
                'name'         => 'Bella',
                'type'         => 'anjing',
                'breed'        => 'Beagle',
                'gender'       => 'betina',
                'age'          => '5 bulan',
                'description'  => 'Nama ku Bella, aku ceria dan selalu bahagia',
                'personality'  => 'Sangat friendly dan mudah dilatih',
                'favorite_food'=> 'Daging ayam',
                'favorite_toy' => 'Frisbee',
                'health'       => 'Sehat, cek kesehatan rutin dilakukan',
                'rescue_story' => 'Aku ditemukan tersesat di taman kota',
                'suitable_for' => 'Pemilik yang suka jogging dan aktivitas outdoor',
                'images'       => json_encode([
                    'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600',
                    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600',
                    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600',
                ]),
                'status' => 'available',
                'price'  => 0,
            ],
            [
                'name'         => 'Rocky',
                'type'         => 'anjing',
                'breed'        => 'Bulldog',
                'gender'       => 'jantan',
                'age'          => '8 bulan',
                'description'  => 'Hi, aku Rocky! Tampangku garang tapi hatiku lembut',
                'personality'  => 'Tenang, santai, dan suka tidur',
                'favorite_food'=> 'Snack tulang',
                'favorite_toy' => 'Boneka squeaky',
                'health'       => 'Sangat sehat dan kuat',
                'rescue_story' => 'Aku diselamatkan dari breeding ilegal',
                'suitable_for' => 'Pemilik yang suka di rumah dan santai',
                'images'       => json_encode([
                    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600',
                    'https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=600',
                    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=600',
                ]),
                'status' => 'available',
                'price'  => 0,
            ],
        ];

        foreach ($pets as $pet) {
            Pet::create($pet);
        }

        // ==================== SHOP PRODUCTS ====================
        $products = [
            // Baju
            ['name' => 'Baju Kucing Lucu Pink',    'category' => 'baju',       'description' => 'Baju dengan motif lucu untuk kucing kesayangan',    'price' => 45000,  'image' => 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400', 'stock' => 15],
            ['name' => 'Sweater Anjing Hangat',    'category' => 'baju',       'description' => 'Sweater tebal untuk anjing di musim hujan',          'price' => 75000,  'image' => 'https://images.unsplash.com/photo-1583511655826-05700d6f1f1d?w=400', 'stock' => 10],
            // Aksesoris
            ['name' => 'Kalung Lucu Lonceng',      'category' => 'aksesoris',  'description' => 'Kalung dengan lonceng untuk hewan peliharaan',       'price' => 25000,  'image' => 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400', 'stock' => 25],
            ['name' => 'Pita Cantik',              'category' => 'aksesoris',  'description' => 'Pita hias untuk kucing dan anjing',                  'price' => 15000,  'image' => 'https://images.unsplash.com/photo-1581888227599-779811939961?w=400', 'stock' => 30],
            // Makanan
            ['name' => 'Royal Canin Kitten 1kg',  'category' => 'makanan',    'description' => 'Makanan premium untuk anak kucing',                  'price' => 125000, 'image' => 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', 'stock' => 20],
            ['name' => 'Dog Food Premium 2kg',    'category' => 'makanan',    'description' => 'Makanan anjing dengan nutrisi lengkap',              'price' => 150000, 'image' => 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', 'stock' => 15],
            // Snack
            ['name' => 'Snack Kucing Tuna',       'category' => 'snack',      'description' => 'Snack rasa tuna yang disukai kucing',                'price' => 20000,  'image' => 'https://images.unsplash.com/photo-1548048026-5a1a941d93d3?w=400', 'stock' => 40],
            ['name' => 'Biskuit Anjing',           'category' => 'snack',      'description' => 'Biskuit sehat untuk anjing',                         'price' => 30000,  'image' => 'https://images.unsplash.com/photo-1628407284695-d3c9fe1d79c1?w=400', 'stock' => 35],
            // Pasir
            ['name' => 'Pasir Kucing Gumpal 5L',  'category' => 'pasir',      'description' => 'Pasir kucing yang mudah dibersihkan',                'price' => 45000,  'image' => 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400', 'stock' => 30],
            // Alat Makan
            ['name' => 'Mangkuk Makan Stainless', 'category' => 'alat-makan', 'description' => 'Mangkuk anti karat untuk makanan',                   'price' => 35000,  'image' => 'https://images.unsplash.com/photo-1591768575042-c7c2e0a43363?w=400', 'stock' => 20],
            ['name' => 'Feeder Otomatis',          'category' => 'alat-makan', 'description' => 'Tempat makan otomatis dengan timer',                 'price' => 180000, 'image' => 'https://images.unsplash.com/photo-1544435253-f0ead49638fa?w=400', 'stock' => 8],
            // Alat Minum
            ['name' => 'Fountain Air Minum',      'category' => 'alat-minum', 'description' => 'Air mancur untuk hewan peliharaan',                  'price' => 150000, 'image' => 'https://images.unsplash.com/photo-1563225408-d0e2b6e2b90b?w=400', 'stock' => 10],
            // Kandang
            ['name' => 'Kandang Kucing Besar',    'category' => 'kandang',    'description' => 'Kandang luas dengan 3 tingkat',                      'price' => 850000, 'image' => 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400', 'stock' => 5],
            // Alat Tidur
            ['name' => 'Kasur Empuk Kucing',      'category' => 'alat-tidur', 'description' => 'Kasur lembut dan nyaman',                            'price' => 95000,  'image' => 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', 'stock' => 15],
            ['name' => 'Rumah Kucing Tertutup',   'category' => 'alat-tidur', 'description' => 'Rumah kucing dengan privacy',                        'price' => 175000, 'image' => 'https://images.unsplash.com/photo-1591871937573-74dbba515c4c?w=400', 'stock' => 12],
        ];

        foreach ($products as $product) {
            ShopProduct::create($product);
        }
    }
}
