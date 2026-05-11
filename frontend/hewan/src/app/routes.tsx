import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';

import Register from './pages/Register';
import Adoption from './pages/Adoption';
import PetDetail from './pages/PetDetail';
import Reservation from './pages/Reservation';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Activity from './pages/Activity';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPets from './pages/admin/AdminPets';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReservations from './pages/admin/AdminReservations';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login },

      { path: 'register', Component: Register },
      { path: 'adopsi', Component: Adoption },
      { path: 'adopsi/:id', Component: PetDetail },
      { path: 'reservasi', Component: Reservation },
      { path: 'belanja', Component: Shop },
      { path: 'keranjang', Component: Cart },
      { path: 'aktivitas', Component: Activity },
      {
        path: 'admin',
        Component: AdminDashboard,
        children: [
          { index: true, Component: AdminPets },
          { path: 'hewan', Component: AdminPets },
          { path: 'produk', Component: AdminProducts },
          { path: 'pesanan', Component: AdminOrders },
          { path: 'reservasi', Component: AdminReservations },
          { path: 'review', Component: AdminReviews },
          { path: 'laporan', Component: AdminReports },
        ]
      }
    ]
  }
]);
