import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Xendit } from 'xendit-node';

const prisma = new PrismaClient();
const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY! });

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
      // Update Order jadi PROCESSING
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" }
      });

      // Update Payment jadi PAID
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() }
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