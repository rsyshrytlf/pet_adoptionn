import { createContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Pet, Product, GroomingPackage } from '../types';
import { getPets, getShopProducts } from '../services/api';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  updateCartItem: (index: number, item: CartItem) => void;
  cartCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);


interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const initCart = async () => {
      const savedCart = sessionStorage.getItem('cart');
      if (savedCart) {
        let parsedCart: CartItem[] = JSON.parse(savedCart);
        setCart(parsedCart);

        try {
          const [pets, products] = await Promise.all([
            getPets(),
            getShopProducts()
          ]);

          let hasChanges = false;
          const updatedCart = parsedCart.filter(cartItem => {
            if (cartItem.type === 'pet') {
              const petInDb = pets.find((p: any) => p.id == cartItem.item.id);
              if (!petInDb || petInDb.status !== 'available') {
                hasChanges = true;
                return false;
              }
            } else if (cartItem.type === 'product') {
              const productInDb = products.find((p: any) => p.id == cartItem.item.id);
              if (!productInDb || productInDb.stock === 0) {
                hasChanges = true;
                return false;
              } else if (cartItem.quantity && productInDb.stock < cartItem.quantity) {
                cartItem.quantity = productInDb.stock;
                hasChanges = true;
              }
            }
            return true;
          });

          if (hasChanges) {
            setCart(updatedCart);
            sessionStorage.setItem('cart', JSON.stringify(updatedCart));
          }
        } catch (e) {
          console.error("Failed to validate cart data", e);
        }
      }
    };
    initCart();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleClearCart = () => setCart([]);
    window.addEventListener('cart_clear', handleClearCart);
    return () => window.removeEventListener('cart_clear', handleClearCart);
  }, []);

const addToCart = (item: CartItem) => {
  setCart(prev => {
    const existingIndex = prev.findIndex(
      (cartItem) =>
        cartItem.item.id === item.item.id &&
        cartItem.type === item.type
    );

 if (existingIndex !== -1) {
  const updated = [...prev];

  updated[existingIndex].quantity = item.quantity || 1;

  return updated;
}

    // 👉 kalau belum ada → tambah baru
    return [...prev, { ...item, quantity: item.quantity || 1 }];
  });
};
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateCartItem = (index: number, item: CartItem) => {
    setCart(prev => prev.map((cartItem, i) => i === index ? item : cartItem));
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateCartItem,
    cartCount: cart.length
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};