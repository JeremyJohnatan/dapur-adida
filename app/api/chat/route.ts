import { beamsClient } from "@/lib/beams";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";


// GET: Ambil riwayat chat
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const partnerId = searchParams.get("userId");

  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;

  try {
    // Mode Inbox Admin
    if (role === "ADMIN" && mode === "inbox") {
      const chats = await prisma.chat.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        orderBy: { sentAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, role: true } },
          receiver: { select: { id: true, fullName: true, role: true } }
        }
      });

      const inboxMap = new Map();
      for (const chat of chats) {
        const partner = chat.senderId === userId ? chat.receiver : chat.sender;
        if (!inboxMap.has(partner.id)) {
          inboxMap.set(partner.id, {
            userId: partner.id,
            name: partner.fullName,
            lastMessage: chat.message,
            lastTime: chat.sentAt,
            unread: !chat.isRead && chat.receiverId === userId
          });
        }
      }
      return NextResponse.json(Array.from(inboxMap.values()));
    }

    // Mode Detail Chat (Room)
    // Jika Admin -> Ambil chat dengan partnerId (Customer)
    // Jika Customer -> Ambil chat dengan Admin (userId sendiri vs Admin)
    const filter = role === "ADMIN" && partnerId 
      ? {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId }
          ]
        }
      : {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        };

    const chats = await prisma.chat.findMany({
      where: filter,
      orderBy: { sentAt: 'asc' },
      include: { sender: { select: { fullName: true } } }
    });

    return NextResponse.json(chats);

  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// POST: Kirim Pesan
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { message, targetUserId } = body;

    const senderId = session?.user?.id;
    const senderRole = session?.user?.role;
    let receiverId = "";

    // Logika Penerima
    if (senderRole === "ADMIN") {
      if (!targetUserId) return NextResponse.json({ message: "Target required" }, { status: 400 });
      receiverId = targetUserId;
    } else {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      receiverId = admin ? admin.id : senderId;
    }

    // Simpan Database
    const newChat = await prisma.chat.create({
      data: { message, senderId, receiverId, isRead: false },
      include: { sender: { select: { fullName: true } } }
    });

    // --- LOGIKA CHANNEL NAME (PENTING!) ---
    // Channel selalu menggunakan ID Customer.
    // Jika Admin kirim ke Budi -> Channel: chat-ID_BUDI
    // Jika Budi kirim ke Admin -> Channel: chat-ID_BUDI
    const customerId = senderRole === "ADMIN" ? receiverId : senderId;
    const channelName = `chat-${customerId}`;

    // 1. Trigger Update Chat Room
    await pusherServer.trigger(channelName, "new-message", newChat);

    // 2. Trigger Inbox Admin (Jika pengirim bukan admin)
    if (senderRole !== "ADMIN") {
      await pusherServer.trigger("admin-channel", "new-inbox", {
        userId: senderId,
        name: session.user.name,
        lastMessage: message,
        lastTime: newChat.sentAt
      });
    }

    // 3. Trigger Notifikasi (Beams)
    try {
      const notifyInterest = senderRole === "ADMIN" ? `user-${receiverId}` : "admin-global";
      const notifyTitle = senderRole === "ADMIN" ? "Pesan dari Admin" : `Pesan dari ${session.user.name}`;
      
      await beamsClient.publishToInterests([notifyInterest], {
        web: {
          notification: {
            title: notifyTitle,
            body: message,
            deep_link: "http://localhost:3000/chat",
          },
        },
      });
    } catch (e) {
      console.log("Beams error (optional)");
    }

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}