import { prisma } from "@/lib/prisma";
import { xenditClient } from "@/lib/xendit";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { orderId } = await request.json();

    // 1. Ambil data payment dari database
    const payment = await prisma.payment.findFirst({
      where: { orderId: orderId },
    });

    if (!payment || !payment.xenditInvoiceId) {
      return NextResponse.json({ message: "Invoice tidak ditemukan" }, { status: 404 });
    }

    // 2. Tanya ke Xendit (FIXED: Pakai getInvoiceById)
    console.log(`🔍 Mengecek Invoice ID: ${payment.xenditInvoiceId}`);
    
    const invoice = await xenditClient.Invoice.getInvoiceById({
      invoiceId: payment.xenditInvoiceId // Perhatikan: 'invoiceId' (kecil), bukan 'invoiceID'
    });

    // --- DEBUGGING ---
    console.log(`🧾 STATUS: ${invoice.status}`);
    // -----------------

    // 3. Cek Status & Update Database
    const currentStatus = invoice.status.toUpperCase();

    if (currentStatus === "PAID" || currentStatus === "SETTLED") {
      // Transaction untuk update order, payment, dan kurangi stock
      await prisma.$transaction(async (tx) => {
        // Update Order jadi PROCESSING
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PROCESSING" }
        });

        // Update Payment jadi PAID
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() }
        });

        // Ambil order items untuk kurangi stock
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: orderId },
          include: { menu: true }
        });

        // Kurangi stock untuk setiap menu
        for (const item of orderItems) {
          await tx.menu.update({
            where: { id: item.menuId },
            data: { stock: { decrement: item.quantity } }
          });

          // Trigger Pusher untuk stock update realtime
          await pusherServer.trigger("stock-updates", "stock-changed", {
            menuId: item.menuId,
            menuName: item.menu?.name,
            newStock: (item.menu?.stock || 0) - item.quantity,
            quantityDecrease: item.quantity
          });
        }
      });

      return NextResponse.json({ status: "PAID", message: "Pembayaran Lunas! Pesanan diproses." });
    } 
    else if (currentStatus === "EXPIRED") {
      return NextResponse.json({ status: "EXPIRED", message: "Invoice kadaluarsa." });
    }

    return NextResponse.json({ status: "PENDING", message: "Menunggu pembayaran..." });

  } catch (error: any) {
    console.error("❌ Check Payment Error:", error);
    return NextResponse.json({ message: error.message || "Gagal cek status" }, { status: 500 });
  }
}