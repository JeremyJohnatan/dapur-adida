import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic"; 

// --- GET: AMBIL SEMUA PESANAN ---
export async function GET(request: Request) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true, 
        items: { include: { menu: true } },
        payment: true, 
      },
    });

    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      status: order.status,
      // Field note wajib ada agar muncul di Admin
      note: order.note || null, 
      totalAmount: order.totalAmount ? order.totalAmount.toString() : "0",
      createdAt: order.createdAt, 
      paymentUrl: order.payment?.paymentUrl || null,
      
      user: {
        id: order.user?.id || "", 
        fullName: order.user?.name || order.user?.fullName || "Pelanggan (Tanpa Nama)",
        email: order.user?.email || "-",
      },

      items: order.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price ? item.price.toString() : "0",
        menu: {
          name: item.menu?.name || "Menu Tidak Ditemukan",
        }
      }))
    }));

    return NextResponse.json(formattedOrders);

  } catch (error) {
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

    await pusherServer.trigger(`order-updates-${updatedOrder.userId}`, 'status-update', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      message: `Status pesanan Anda telah diupdate ke ${updatedOrder.status}`,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("🔥 ERROR PATCH ORDER:", error);
    return NextResponse.json({ message: "Gagal update status" }, { status: 500 });
  }
}