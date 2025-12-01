import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// Hapus auth sementara untuk debugging jika session bermasalah
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic"; // Wajib: agar data tidak di-cache oleh Next.js

// --- GET: AMBIL SEMUA PESANAN (UNTUK HALAMAN ADMIN) ---
export async function GET(request: Request) {
  try {
    // 1. Ambil data dari database
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true, // Ambil data user
        items: {
          include: {
            menu: true, // Ambil data menu di dalam items
          },
        },
        payment: true, // Ambil info payment jika ada
      },
    });

    // 2. Format ulang data (Mapping) untuk mencegah Error JSON Serialization
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      status: order.status,
      // Konversi Decimal/BigInt ke string agar JSON tidak error
      totalAmount: order.totalAmount ? order.totalAmount.toString() : "0",
      createdAt: order.createdAt, 
      paymentUrl: order.payment?.paymentUrl || null,
      
      // Handle User: Cek field 'name' atau 'fullName', handle jika user null
      user: {
        fullName: order.user?.name || order.user?.fullName || "Pelanggan (Tanpa Nama)",
        email: order.user?.email || "-",
      },

      // Handle Items
      items: order.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        // Konversi harga item ke string juga
        price: item.price ? item.price.toString() : "0",
        menu: {
          name: item.menu?.name || "Menu Tidak Ditemukan",
        }
      }))
    }));

    return NextResponse.json(formattedOrders);

  } catch (error) {
    // Log error di terminal server (VS Code terminal) untuk debugging
    console.error("🔥 ERROR API ADMIN ORDERS:", error);
    
    return NextResponse.json(
      { message: "Gagal mengambil data pesanan", error: String(error) }, 
      { status: 500 }
    );
  }
}

// --- PATCH: UPDATE STATUS PESANAN ---
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("🔥 ERROR PATCH ORDER:", error);
    return NextResponse.json({ message: "Gagal update status" }, { status: 500 });
  }
}