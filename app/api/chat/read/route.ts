// app/api/chat/read/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // sesuaikan path prismamu
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // sesuaikan path authmu

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

  const { userId } = await req.json(); // ID customer yg chatnya mau dibaca

  try {
    // Update semua chat dari user tersebut yang diterima admin menjadi isRead = true
    await prisma.chat.updateMany({
      where: {
        senderId: userId, // Pesan DARI customer
        receiverId: session.user.id, // KE admin
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}