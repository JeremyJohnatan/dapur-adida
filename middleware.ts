import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // 1. Proteksi Halaman Admin
    // Jika user mencoba akses url yang berawalan '/admin'
    // TAPI role-nya BUKAN 'ADMIN', maka lempar ke halaman utama.
    if (
      req.nextUrl.pathname.startsWith("/admin") &&
      req.nextauth.token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Fungsi ini menentukan apakah user "Boleh Lewat" atau tidak.
      // return true = boleh lewat. return false = redirect ke login.
      authorized: ({ token }) => !!token, // Harus punya token (sudah login)
    },
  }
);

// Tentukan halaman mana saja yang WAJIB Login
export const config = {
  matcher: [
    "/admin/:path*", // Semua halaman admin
    "/cart",         // Keranjang
    "/orders",       // Riwayat Pesanan
    "/profile",      // Profil
    "/chat",         // Halaman Chat
    "/api/orders",   // API Order (Biar gak ditembak postman sembarangan)
    "/api/chat",     // API Chat
  ],
};