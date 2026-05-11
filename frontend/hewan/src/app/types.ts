export interface User {
  id: string;
  email: string;
  name: string;
  address: string;
  phone: string;
  isAdmin: boolean;
}

export interface Pet {
  id: string;
  price : number;
  name: string;
  type: 'kucing' | 'anjing';
  breed: string;
  gender: 'jantan' | 'betina';
  age: string;
  description: string;
  personality: string;
  favoriteFood: string;
  favoriteToy: string;
  health: string;
  rescueStory: string;
  suitableFor: string;
  images: string[];
  status: 'available' | 'booked' | 'adopted';
  bookedUntil?: Date;
  bookedAt?: number;
 
}

export interface Product {
  id: string;
  name: string;
  category: 'baju' | 'aksesoris' | 'makanan' | 'snack' | 'pasir' | 'alat-makan' | 'alat-minum' | 'kandang' | 'alat-tidur';
  description: string;
  price: number;
  image: string;
  stock: number;
}

export interface GroomingPackage {
  id: string;
  name: string;
  services: string[];
  price: number;
  duration: string;
  image: string;
}

export interface CartItem {
  type: 'pet' | 'product' | 'grooming';
  item: Pet | Product | GroomingPackage;
  quantity?: number;
  selectedDate?: Date;
  selectedTime?: string;
}

export interface Order {
  userConfirmed?: boolean;
  adminCompleted?: boolean;

  id: string;
  userId: string;

  userName?: string; // ✅ TAMBAH DI SINI

  items: CartItem[];
  totalAmount: number;
  deliveryMethod?: 'pickup' | 'delivery';
  deliveryFee?: number;
  paymentProof?: string;
  pickupProof?: string;
  deliveryProof?: string;

  status:
    | 'unpaid'
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'ready'
    | 'completed'
    | 'cancelled';

  orderType: 'adoption' | 'product' | 'grooming' | 'reservation';
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: number;
  uniqueCode: string;

  review?: {
    rating: number;
    comment: string;
    approved: boolean;
    image?: string | null;
    userName?: string;
    createdAt?: string;
  },

  userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}


export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: Date;
  time: string;
  type: 'shelter' | 'grooming';
  groomingPackage?: GroomingPackage;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  adminFee: number;
  paymentProof?: string;
  attended?: boolean;
  createdAt: number; // ✅ cukup 1 kali di sini
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  serviceType: 'adoption' | 'grooming' | 'product';
  approved: boolean;
  createdAt: Date;
}
