import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"; 
import { authOptions } from "../auth/[...nextauth]/route"; 

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Cek Login
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil data
    const body = await request.json();
    const { items, totalPrice } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Keranjang kosong" }, { status: 400 });
    }

    // 3. Simpan ke Database (Transaction)
    const newOrder = await prisma.$transaction(async (tx) => {
      // A. Order Utama
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: totalPrice,
          status: "PENDING",
        },
      });

      // B. Detail Item
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuId: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          },
        });
      }

      return order;
    });

    return NextResponse.json(
      { message: "Order berhasil", orderId: newOrder.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Order Error:", error);
    return NextResponse.json(
      { message: "Gagal membuat pesanan" },
      { status: 500 }
    );
  }
}