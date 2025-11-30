import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"; 
import { authOptions } from "../auth/[...nextauth]/route"; 
import { beamsClient } from "@/lib/beams"; 

const prisma = new PrismaClient();

// --- GET PESANAN SAYA ---
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // DEBUG 1: Cek siapa yang request
    console.log("🔍 API GET ORDERS dipanggil");
    
    if (!session || !session.user) {
      console.log("❌ User tidak ada session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 User yang login ID:", session.user.id);
    console.log("👤 User Name:", session.user.name);

    // Ambil pesanan milik user yang sedang login saja
    const myOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id // Pastikan ini string ID yang benar
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    });

    // DEBUG 2: Cek hasil database
    console.log("📦 Jumlah pesanan ditemukan:", myOrders.length);
    if (myOrders.length > 0) {
        console.log("✅ Contoh Order ID:", myOrders[0].id);
    } else {
        console.log("⚠️ Tidak ada pesanan untuk User ID ini.");
    }

    return NextResponse.json(myOrders);
  } catch (error) {
    console.error("❌ Error Get Order:", error);
    return NextResponse.json({ message: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

// --- POST BUAT PESANAN ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, totalPrice } = body;

    console.log("📝 Membuat Order Baru untuk User ID:", session.user.id);

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
  

    // Notifikasi Beams
    try {
      await beamsClient.publishToInterests(["admin-global"], {
        web: {
          notification: {
            title: "Pesanan Baru Masuk! 💰",
            body: `${session.user.name} baru saja memesan senilai Rp ${totalPrice.toLocaleString()}`,
            deep_link: "http://localhost:3000/admin/orders",
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