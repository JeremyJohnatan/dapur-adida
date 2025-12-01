import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"; 
import { authOptions } from "../auth/[...nextauth]/route"; 
import { beamsClient } from "@/lib/beams"; 
import { Xendit } from 'xendit-node'; 

const prisma = new PrismaClient();

const apiKey = process.env.XENDIT_SECRET_KEY;
const xenditClient = new Xendit({ secretKey: apiKey || "" });

// --- GET ---
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const myOrders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { menu: true } }, payment: true }
    });
    return NextResponse.json(myOrders);
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

// --- POST ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { items, totalPrice } = body;

    if (!items || items.length === 0) return NextResponse.json({ message: "Keranjang kosong" }, { status: 400 });

    const amountNumber = Number(totalPrice);
    
    // Fallback Email
    let validEmail = "customer@dapuradida.com";
    const sessionEmail = session.user.email;
    if (sessionEmail && sessionEmail.includes("@")) {
      validEmail = sessionEmail;
    } else {
       const sanitizedName = session.user.name?.replace(/\s+/g, '').toLowerCase() || "user";
       validEmail = `${sanitizedName}@temp.dapuradida.com`;
    }

    // Base URL (Ganti ini jika nanti deploy ke Vercel)
    const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: amountNumber,
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
      
      // BUAT INVOICE DENGAN REDIRECT URL
      const xenditInvoice = await xenditClient.Invoice.createInvoice({
        data: {
          externalId: order.id,
          amount: amountNumber,
          payerEmail: validEmail,
          description: `Order #${order.id.slice(-5)} - Dapur Adida`,
          invoiceDuration: 86400,
          currency: "IDR",
          // INI PENTING: Arahkan balik ke halaman sukses/gagal di aplikasi kita
          successRedirectUrl: `${BASE_URL}/order-success`, 
          failureRedirectUrl: `${BASE_URL}/cart`,
        }
      });

      const paymentLink = xenditInvoice.invoiceUrl || (xenditInvoice as any).invoice_url;
      if (!paymentLink) throw new Error("Gagal dapat Link Pembayaran");

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: amountNumber,
          status: "PENDING",
          xenditInvoiceId: xenditInvoice.id,
          paymentUrl: paymentLink, 
        }
      });

      return { order, paymentLink };
    });

    try {
      await beamsClient.publishToInterests(["admin-global"], {
        web: {
          notification: {
            title: "Tagihan Baru 💳",
            body: `${session.user.name} memesan Rp ${amountNumber.toLocaleString()}`,
            deep_link: "http://localhost:3000/admin/orders",
          },
        },
      });
    } catch (e) {}

    return NextResponse.json({ 
        message: "Order berhasil", 
        orderId: result.order.id,
        paymentUrl: result.paymentLink 
      }, { status: 201 });

  } catch (error: any) {
    console.error("Order Error:", error);
    return NextResponse.json({ message: error.message || "Gagal" }, { status: 500 });
  }
}