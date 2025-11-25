import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ambil semua menu dari database, urutkan berdasarkan nama (A-Z)
    const menus = await prisma.menu.findMany({
      orderBy: {
        name: 'asc', 
      },
    });

    return NextResponse.json(menus, { status: 200 });
  } catch (error) {
    console.error("Gagal mengambil menu:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data menu" },
      { status: 500 }
    );
  }
}