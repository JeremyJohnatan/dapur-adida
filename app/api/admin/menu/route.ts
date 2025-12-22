import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// GET: Ambil Semua Menu
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(menus);
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil data menu" }, { status: 500 });
  }
}

// POST: Tambah Menu Baru (Solusi Error 405)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Validasi Admin
  if (!session || session?.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const newMenu = await prisma.menu.create({
      data: {
        name: body.name,
        description: body.description,
        price: Number(body.price), // Konversi ke Number agar tidak error
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable ?? true,
        stock: Number(body.stock) ?? 0,
      },
    });

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error) {
    console.error("Error create menu:", error);
    return NextResponse.json({ message: "Gagal menambah menu" }, { status: 500 });
  }
}