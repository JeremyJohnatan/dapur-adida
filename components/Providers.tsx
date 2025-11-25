"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext"; // Import CartProvider

export const NextAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      {/* Bungkus aplikasi dengan CartProvider juga */}
      <CartProvider>
        {children}
      </CartProvider>
    </SessionProvider>
  );
};