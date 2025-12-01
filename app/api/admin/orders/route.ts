import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"; 
import { authOptions } from "../auth/[...nextauth]/route"; 
import { beamsClient } from "@/lib/beams"; 
import { Xendit } from 'xendit-node'; // 1. Import Xendit

const prisma = new PrismaClient();
// 2. Inisialisasi Xendit Client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

// --- GET PESANAN SAYA (Tetap Sama) ---
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const myOrders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { menu: true } },
        payment: true // Sertakan info pembayaran
      }
    });

    return NextResponse.json(myOrders);
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

// --- POST BUAT PESANAN & INVOICE XENDIT ---
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

    // 3. Mulai Transaksi Database
    const result = await prisma.$transaction(async (tx) => {
      // A. Buat Order
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: totalPrice,
          status: "PENDING",
        },
      });

      // B. Buat Item Detail
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

      // C. Buat Invoice Xendit
      const xenditInvoice = await xenditClient.Invoice.createInvoice({
        data: {
          externalId: order.id,
          amount: totalPrice,
          payerEmail: session.user.email || "customer@dapuradida.com",
          description: `Pembayaran Order #${order.id.slice(-5)} - Dapur Adida`,
          invoiceDuration: 86400, // 24 Jam
          currency: "IDR",
        }
      });

      // D. Simpan Data Pembayaran ke Tabel Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalPrice,
          status: "PENDING",
          xenditInvoiceId: xenditInvoice.id,
          paymentUrl: xenditInvoice.invoiceUrl, // Simpan Link Pembayaran
        }
      });

      return { order, xenditInvoice };
    });
    
    console.log("✅ Order & Invoice Xendit Berhasil:", result.order.id);

    // 4. Notifikasi ke Admin (Bahwa ada Invoice Baru dibuat)
    try {
      await beamsClient.publishToInterests(["admin-global"], {
        web: {
          notification: {
            title: "Tagihan Baru Dibuat 💳",
            body: `${session.user.name} membuat pesanan Rp ${totalPrice.toLocaleString()}. Menunggu pembayaran.`,
            deep_link: "http://localhost:3000/admin/orders",
          },
        },
      });
    } catch (beamError) {
      console.error("Gagal kirim notif Beams:", beamError);
    }

    // 5. Kembalikan URL Pembayaran ke Frontend
    return NextResponse.json(
      { 
        message: "Order berhasil", 
        orderId: result.order.id,
        paymentUrl: result.xenditInvoice.invoiceUrl // Kirim URL ini agar frontend bisa redirect
      },
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