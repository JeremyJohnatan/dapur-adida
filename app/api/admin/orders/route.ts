import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  // Proteksi API: Hanya Admin
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }, // Pesanan terbaru di atas
      include: {
        user: { select: { fullName: true, email: true } }, // Ambil nama pemesan
        items: {
          include: { menu: true } // Ambil detail menu yang dipesan
        }
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
  }
}

// API untuk Update Status (Misal: Pending -> Cooking)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { orderId, status } = body;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ message: "Error updating order" }, { status: 500 });
  }
}