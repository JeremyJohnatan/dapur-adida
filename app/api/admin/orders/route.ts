import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic"; 

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
      note: order.note || null,
      address: order.user?.address || null,
      deliveryTime: order.deliveryTime || null,
      totalAmount: order.totalAmount ? order.totalAmount.toString() : "0",
      createdAt: order.createdAt,
      paymentUrl: order.payment?.paymentUrl || null,
      
      user: {
        id: order.user?.id || "",
        fullName: order.user?.name || order.user?.fullName || "Pelanggan (Tanpa Nama)",
        email: order.user?.email || "-",
        phoneNumber: order.user?.phoneNumber || "-",
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, address, deliveryTime } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (address !== undefined) {
        await tx.user.update({
          where: { id: order.userId },
          data: { address: address },
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      return updatedOrder;
    });

    if (status) {
      await pusherServer.trigger(`order-updates-${order.userId}`, 'status-update', {
        orderId: result.id,
        status: result.status,
        message: `Status pesanan Anda telah diupdate ke ${result.status}`,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("🔥 ERROR PATCH ORDER:", error);
    return NextResponse.json({ message: "Gagal update order" }, { status: 500 });
  }
}