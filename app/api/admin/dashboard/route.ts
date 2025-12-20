import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server"; // Tambah NextRequest

export async function GET(req: NextRequest) { // Ubah param jadi NextRequest
  const session = await getServerSession(authOptions);
  
  // Proteksi: Hanya Admin
  if (!session || session?.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // --- AMBIL TANGGAL DARI URL ---
  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // Default: 7 Hari Terakhir jika tidak ada filter
  const end = endDateParam ? new Date(endDateParam) : new Date();
  const start = startDateParam ? new Date(startDateParam) : new Date(new Date().setDate(end.getDate() - 6));

  // Reset jam agar mencakup seluruh hari (00:00 - 23:59)
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  try {
    // 1. Hitung Ringkasan Utama (Tetap Global / All Time)
    const revenue = await prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'COMPLETED' } });
    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalMenu = await prisma.menu.count({ where: { isAvailable: true } });

    // 2. Data Grafik (MODIFIKASI: Filter Berdasarkan Tanggal & Agregasi)
    const ordersForGraph = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: { not: 'CANCELLED' } // Opsional: Jangan hitung yang batal
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, totalAmount: true }
    });

    // --- LOGIKA MANUAL: Grouping per hari ---
    // Kita buat array tanggal dari start sampai end agar grafik tidak bolong (misal tgl 12 ada, tgl 13 kosong, tgl 14 ada)
    const chartDataMap: Record<string, number> = {};
    
    // Inisialisasi setiap hari dengan 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }); 
      chartDataMap[dateKey] = 0;
    }

    // Isi data dari database
    ordersForGraph.forEach(order => {
      const dateKey = new Date(order.createdAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      // Pastikan key ada (untuk jaga-jaga timezone)
      if (chartDataMap[dateKey] !== undefined) {
        chartDataMap[dateKey] += Number(order.totalAmount);
      }
    });

    // Ubah Object ke Array untuk Recharts
    const chartData = Object.keys(chartDataMap).map(key => ({
      name: key,
      total: chartDataMap[key],
    }));

    // 3. DATA MENU TERLARIS (Tetap Sama)
    const topItems = await prisma.orderItem.groupBy({
      by: ['menuId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Ambil detail nama menu
    const menuIds = topItems.map(item => item.menuId);
    const menuDetails = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
      select: { id: true, name: true, price: true }
    });

    const topMenus = topItems.map(item => {
      const menu = menuDetails.find(m => m.id === item.menuId);
      return {
        name: menu?.name || "Menu Terhapus",
        sold: item._sum.quantity || 0,
        price: Number(menu?.price || 0),
      };
    });

    // 4. DATA PESANAN TERBARU (Tetap Sama)
    const recentOrdersList = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } }
      }
    });

    // Return semua data
    return NextResponse.json({
      revenue: revenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      totalMenu,
      chartData, // <--- Ini sekarang data dinamis sesuai tanggal
      topMenus,       
      recentOrdersList 
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}