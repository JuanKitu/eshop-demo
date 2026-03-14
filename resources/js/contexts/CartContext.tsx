import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  sale_price?: number;
  cover_image?: string;
  image?: string;
  quantity: number;
  stock: number;
  is_active: boolean;
  variants?: { [key: string]: string } | any;
  selected_variants?: { [key: string]: string } | any;
  total: number;
  category?: {
    id: number;
    name: string;
  };
}

interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  summary: CartSummary;
  loading: boolean;
  addToCart: (product: any, variants?: any, quantity?: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  syncCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode; storeId: number; isLoggedIn: boolean }> = ({
  children,
  storeId,
  isLoggedIn
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);

  const getLocalCart = (): CartItem[] => {
    try {
      const cart = localStorage.getItem(`cart_${storeId}`);
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  };

  const setLocalCart = (cartItems: CartItem[]) => {
    localStorage.setItem(`cart_${storeId}`, JSON.stringify(cartItems));
  };

  const refreshCart = async () => {
    try {
      const response = await axios.get(route('api.cart.index'), { params: { store_id: storeId } });
      const cartItems = response.data.items || [];
      const cartCount = response.data.count || cartItems.length || 0;

      setItems(cartItems);
      setCount(cartCount);
      setTotal(response.data.total || 0);
      setSummary({
        subtotal: response.data.subtotal || 0,
        discount: response.data.discount || 0,
        shipping: response.data.shipping || 0,
        tax: response.data.tax || 0,
        total: response.data.total || 0
      });


      // Force re-render by updating count in next tick
      setTimeout(() => {
        setCount(cartCount);
      }, 0);
    } catch (error: any) {
      console.error('Failed to fetch cart:', error);
      setItems([]);
      setCount(0);
      setTotal(0);
    }
  };

  const addToCart = async (product: any, variants?: any, quantity: number = 1) => {
    setLoading(true);
    try {
      // Always use API for now (handles both logged in and guest users)
      await axios.post(route('api.cart.add'), {
        store_id: storeId,
        product_id: product.id,
        quantity: quantity,
        variants
      });
      await refreshCart();
    } catch (error: any) {
      console.error('❌ Failed to add to cart:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    setLoading(true);
    try {
      const response = await axios.put(route('api.cart.update', { id }), { quantity, store_id: storeId });
      await refreshCart();
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: number) => {
    setLoading(true);
    try {
      await axios.delete(route('api.cart.remove', { id }), { params: { store_id: storeId } });
      await refreshCart();
    } catch (error: any) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncCart = async () => {
    if (!isLoggedIn) return;

    const localItems = getLocalCart();
    if (localItems.length === 0) return;

    try {
      await axios.post(route('api.cart.sync'), {
        store_id: storeId,
        items: localItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          variants: item.variants
        }))
      });
      localStorage.removeItem(`cart_${storeId}`);
      await refreshCart();
    } catch (error: any) {
      console.error('Failed to sync cart:', error);
    }
  };

  useEffect(() => {
    refreshCart();
    if (isLoggedIn) {
      syncCart();
    }
  }, [storeId, isLoggedIn]);


  return (
    <CartContext.Provider value={{
      items,
      count,
      total,
      summary,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      syncCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    console.error('❌ CartProvider not found - using default functions');
    return {
      items: [],
      count: 0,
      total: 0,
      summary: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 },
      loading: false,
      addToCart: async () => { },
      updateQuantity: async () => { },
      removeItem: async () => { },
      syncCart: async () => { },
      refreshCart: async () => { }
    };
  }
  return context;
}