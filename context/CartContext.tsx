"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Tipe data untuk item di dalam keranjang
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. Load cart dari LocalStorage saat pertama kali dibuka (agar data tidak hilang saat refresh)
  useEffect(() => {
    const savedCart = localStorage.getItem("dapurAdidaCart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Gagal memuat keranjang", error);
      }
    }
  }, []);

  // 2. Simpan ke LocalStorage setiap kali items berubah (otomatis)
  useEffect(() => {
    localStorage.setItem("dapurAdidaCart", JSON.stringify(items));
  }, [items]);

  // Fungsi Tambah ke Keranjang
  const addToCart = (product: any) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Jika sudah ada, tambah quantity-nya +1
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Jika belum ada, masukkan sebagai item baru
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.price), // Pastikan harga jadi number
        image: product.imageUrl,
        quantity: 1
      }];
    });
  };

  // Fungsi Kurangi Quantity
  const decreaseQuantity = (id: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        // Kurangi 1
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      // Jika sisa 1 dan dikurangi, maka hapus item dari keranjang
      return prev.filter((item) => item.id !== id);
    });
  };

  // Fungsi Hapus Item Total (Tong Sampah)
  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Fungsi Kosongkan Keranjang (Setelah checkout)
  const clearCart = () => {
    setItems([]);
  };

  // Hitung Total
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      decreaseQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook agar mudah dipanggil di halaman lain
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}