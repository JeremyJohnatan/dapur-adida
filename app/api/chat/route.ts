import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode"); // 'inbox' atau null
  const partnerId = searchParams.get("userId"); // ID lawan bicara

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;

  try {
    // --- MODE 1: ADMIN LIHAT DAFTAR INBOX (List Kontak) ---
    if (role === "ADMIN" && mode === "inbox") {
      // Ambil semua chat yang melibatkan admin
      const chats = await prisma.chat.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        orderBy: { sentAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, role: true } },
          receiver: { select: { id: true, fullName: true, role: true } }
        }
      });

      // Grouping berdasarkan User Lawan Bicara (Partner)
      const inboxMap = new Map();
      
      for (const chat of chats) {
        // Tentukan siapa lawan bicaranya
        const partner = chat.senderId === userId ? chat.receiver : chat.sender;
        
        // Masukkan ke map jika belum ada (karena urutan desc, yang pertama masuk adalah chat terbaru)
        if (!inboxMap.has(partner.id)) {
          inboxMap.set(partner.id, {
            userId: partner.id,
            name: partner.fullName,
            role: partner.role,
            lastMessage: chat.message,
            lastTime: chat.sentAt,
            unread: !chat.isRead && chat.receiverId === userId
          });
        }
      }

      return NextResponse.json(Array.from(inboxMap.values()));
    }

    // --- MODE 2: DETAIL CHAT ROOM (Admin buka chat spesifik user) ---
    if (role === "ADMIN" && partnerId) {
      const chats = await prisma.chat.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId }
          ]
        },
        orderBy: { sentAt: 'asc' },
        include: { sender: { select: { fullName: true } } }
      });
      return NextResponse.json(chats);
    }

    // --- MODE 3: CUSTOMER (Hanya lihat chat sendiri dengan Admin) ---
    // Customer tidak butuh inbox, langsung chat room dengan Admin
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { sentAt: 'asc' },
      include: { sender: { select: { fullName: true } } }
    });

    return NextResponse.json(chats);

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { message, targetUserId } = body; // targetUserId opsional untuk Admin

    if (!message) return NextResponse.json({ message: "Kosong" }, { status: 400 });

    const senderId = session.user.id;
    const senderRole = session.user.role;
    let receiverId = "";

    if (senderRole === "ADMIN") {
      // Admin WAJIB kirim targetUserId (mau balas ke siapa)
      if (!targetUserId) {
        return NextResponse.json({ message: "Admin harus memilih tujuan kirim" }, { status: 400 });
      }
      receiverId = targetUserId;
    } else {
      // Customer otomatis kirim ke Admin
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      receiverId = admin ? admin.id : senderId; // Fallback ke diri sendiri jika error
    }

    const newChat = await prisma.chat.create({
      data: {
        message,
        senderId,
        receiverId,
        isRead: false
      }
    });

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}