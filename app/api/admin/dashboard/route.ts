import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // Proteksi: Hanya Admin
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    // 1. Hitung Ringkasan Utama
    const revenue = await prisma.order.aggregate({ _sum: { totalAmount: true } });
    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalMenu = await prisma.menu.count({ where: { isAvailable: true } });

    // 2. Data Grafik (7 Order Terakhir)
    const recentOrdersGraph = await prisma.order.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, totalAmount: true }
    });

    const chartData = recentOrdersGraph.map(order => ({
      name: new Date(order.createdAt).toLocaleDateString('id-ID', { weekday: 'short' }),
      total: Number(order.totalAmount),
    })).reverse();

    // 3. DATA MENU TERLARIS (Ini yang bikin kosong kalau tidak ada)
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

    // 4. DATA PESANAN TERBARU (Ini juga baru)
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
      chartData,
      topMenus,       // <-- Pastikan ini terkirim
      recentOrdersList // <-- Pastikan ini terkirim
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}