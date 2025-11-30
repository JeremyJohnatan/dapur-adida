import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { beamsClient } from "@/lib/beams"; 

const prisma = new PrismaClient();

// --- BARU: GET PESANAN SAYA (History) ---
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil pesanan milik user yang sedang login saja
    const myOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc' // Yang terbaru di atas
      },
      include: {
        items: {
          include: {
            menu: true // Sertakan detail menu (nama, gambar)
          }
        }
      }
    });

    return NextResponse.json(myOrders);
  } catch (error) {
    console.error("Get Order Error:", error);
    return NextResponse.json({ message: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

// --- POST (TETAP SAMA SEPERTI SEBELUMNYA) ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, totalPrice } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Keranjang kosong" }, { status: 400 });
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: totalPrice,
          status: "PENDING",
        },
      });

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

    // --- KIRIM NOTIFIKASI BEAMS KE ADMIN ---
    try {
      await beamsClient.publishToInterests(["admin-global"], {
        web: {
          notification: {
            title: "Pesanan Baru Masuk! 💰",
            body: `${session.user.name} baru saja memesan senilai Rp ${totalPrice.toLocaleString()}`,
            deep_link: "http://localhost:3000/admin/orders", // Arahkan admin ke halaman order
          },
        },
      });
    } catch (beamError) {
      console.error("Gagal kirim notif Beams:", beamError);
    }

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