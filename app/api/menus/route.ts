import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isFeatured = searchParams.get('featured') === 'true';

  try {
    if (isFeatured) {
      // --- LOGIKA 3 MENU TERLARIS (PUBLIC) ---
      
      // 1. Cari 3 menuId dengan quantity terbanyak di orderItem
      const topItems = await prisma.orderItem.groupBy({
        by: ['menuId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 3,
      });

      // 2. Ambil list ID-nya
      const menuIds = topItems.map((item) => item.menuId);

      // 3. Ambil detail menu dari database
      const menus = await prisma.menu.findMany({
        where: { 
          id: { in: menuIds },
          isAvailable: true // Pastikan hanya menu yang tersedia
        },
      });

      // 4. PENTING: Urutkan kembali hasil findMany agar sesuai ranking penjualan
      // (Karena SQL 'IN' tidak menjamin urutan)
      const sortedMenus = topItems
        .map((item) => menus.find((menu) => menu.id === item.menuId))
        .filter(Boolean); // Hapus jika ada menu yang null (misal sudah dihapus)

      return NextResponse.json(sortedMenus, { status: 200 });
    }

    // --- LOGIKA DEFAULT (SEMUA MENU A-Z) ---
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