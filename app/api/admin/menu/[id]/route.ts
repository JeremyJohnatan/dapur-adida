import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// PATCH: Untuk Edit Menu (Update)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params adalah Promise di Next.js baru
) {
  // 1. Tunggu params untuk mendapatkan ID
  const { id } = await params;
  
  // 2. Cek Sesi Login
  const session = await getServerSession(authOptions);

  // 3. Proteksi: Hanya ADMIN yang boleh akses
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak! Khusus Admin." }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // 4. Lakukan Update ke Database
    const updatedMenu = await prisma.menu.update({
      where: { id: id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price ? Number(body.price) : undefined, // Pastikan harga jadi angka
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable,
      },
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error("Gagal update menu:", error);
    return NextResponse.json({ message: "Gagal mengupdate menu" }, { status: 500 });
  }
}

// DELETE: Untuk Hapus Menu
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Tunggu params untuk mendapatkan ID
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // 2. Proteksi: Hanya ADMIN
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak! Khusus Admin." }, { status: 403 });
  }

  try {
    // 3. Hapus data dari Database
    await prisma.menu.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Menu berhasil dihapus" });
  } catch (error) {
    console.error("Gagal hapus menu:", error);
    return NextResponse.json({ message: "Gagal menghapus menu" }, { status: 500 });
  }
}