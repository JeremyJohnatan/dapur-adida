import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET: Ambil riwayat chat user yang sedang login
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Ambil pesan di mana user sebagai pengirim ATAU penerima
    // Diurutkan dari yang terlama ke terbaru (biar seperti chat WA)
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: {
        sentAt: 'asc',
      },
      include: {
        sender: { select: { fullName: true, role: true } },
        receiver: { select: { fullName: true, role: true } }
      }
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Get Chat Error:", error);
    return NextResponse.json({ message: "Gagal memuat pesan" }, { status: 500 });
  }
}

// POST: Kirim pesan baru
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ message: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    const senderId = session.user.id;
    const senderRole = session.user.role; // Perlu type assertion jika typescript komplain, tapi sementara aman

    let receiverId = "";

    // LOGIKA PENENTUAN PENERIMA:
    // Jika yang kirim Customer -> Kirim ke Admin
    if (senderRole === "CUSTOMER") {
      // Cari Admin pertama yang ada di database
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });

      if (!admin) {
        // Fallback darurat jika belum ada admin: Kirim ke diri sendiri dulu (atau handle error)
        // Idealnya kamu harus punya 1 user ROLE 'ADMIN' di database.
        // Untuk tutorial ini, kita cari user apapun yang BUKAN pengirim, atau kembalikan error.
        return NextResponse.json({ message: "Belum ada Admin yang tersedia untuk menerima pesan." }, { status: 404 });
      }
      receiverId = admin.id;
    } else {
      // Jika yang kirim Admin -> Kirim ke Customer (Nanti dikembangkan, butuh customerId dari body)
      // Untuk sekarang kita fokus Customer -> Admin dulu
      return NextResponse.json({ message: "Fitur reply admin belum diaktifkan di endpoint ini." }, { status: 400 });
    }

    // Simpan Pesan
    const newChat = await prisma.chat.create({
      data: {
        message,
        senderId,
        receiverId,
        isRead: false,
      }
    });

    return NextResponse.json(newChat, { status: 201 });

  } catch (error) {
    console.error("Send Chat Error:", error);
    return NextResponse.json({ message: "Gagal mengirim pesan" }, { status: 500 });
  }
}