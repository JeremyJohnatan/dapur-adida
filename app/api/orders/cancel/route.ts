import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true }
    });

    if (!order) {
      return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ message: "Tidak bisa membatalkan order orang lain" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ message: "Hanya bisa membatalkan order yang belum dibayar" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });

    await pusherServer.trigger(`order-updates-${session.user.id}`, 'status-update', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      message: "Pesanan Anda telah dibatalkan."
    });

    return NextResponse.json({ 
      message: "Pesanan berhasil dibatalkan",
      order: updatedOrder
    });
  } catch (error: any) {
    console.error("Cancel Order Error:", error);
    return NextResponse.json({ message: error.message || "Gagal membatalkan pesanan" }, { status: 500 });
  }
}
