import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";

// 1. PENTING: Paksa Next.js agar TIDAK menyimpan cache (Selalu ambil data baru)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Proteksi: Hanya Admin
  if (!session || session?.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // --- AMBIL TANGGAL DARI URL ---
  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // --- LOGIC TANGGAL YANG LEBIH KUAT (Anti Timezone Bug) ---
  const now = new Date();
  
  // Jika parameter ada, tambahkan jam spesifik agar mencakup seluruh hari
  // Start: Jam 00:00:00
  const start = startDateParam 
    ? new Date(`${startDateParam}T00:00:00.000Z`) // Pakai Z atau sesuaikan timezone jika perlu, tapi string ISO lebih aman
    : new Date(new Date().setDate(now.getDate() - 6));

  // End: Jam 23:59:59
  const end = endDateParam 
    ? new Date(`${endDateParam}T23:59:59.999Z`) 
    : new Date();

  // Jika tidak ada param, set default jam start/end manual
  if (!startDateParam) start.setHours(0, 0, 0, 0);
  if (!endDateParam) end.setHours(23, 59, 59, 999);

  // DEBUGGING: Cek terminal kamu (di VS Code) saat refresh halaman dashboard
  console.log("--- DEBUG DASHBOARD API ---");
  console.log("Filter Start:", start);
  console.log("Filter End  :", end);

  try {
    // 1. HITUNG TOTAL PENDAPATAN (REVENUE)
    // PERBAIKAN: Gunakan 'not: CANCELLED' agar sinkron dengan grafik. 
    // Jadi status PENDING dan PROCESSING juga dihitung sebagai "Potensi Pendapatan".
    const revenue = await prisma.order.aggregate({ 
        _sum: { totalAmount: true }, 
        where: { 
            // Ubah ini! Jangan hanya 'COMPLETED' jika ingin lihat pergerakan order baru.
            status: { not: 'CANCELLED' }, 
            createdAt: {
                gte: start,
                lte: end
            }
        } 
    });
    
    console.log("Revenue Result:", revenue._sum.totalAmount); // Cek nilai ini di terminal

    // 2. HITUNG TOTAL ORDER
    const totalOrders = await prisma.order.count({
        where: {
            status: { not: 'CANCELLED' },
            createdAt: {
                gte: start,
                lte: end
            }
        }
    });

    // 3. Total Customer & Menu (Global - Tidak perlu filter tanggal)
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalMenu = await prisma.menu.count({ where: { isAvailable: true } });

    // 4. Data Grafik
    const ordersForGraph = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: { not: 'CANCELLED' } 
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, totalAmount: true }
    });

    // Grouping per hari
    const chartDataMap: Record<string, number> = {};
    
    // Looping tanggal agar grafik tidak bolong
    const loopDate = new Date(start); 
    // Hati-hati infinite loop, batasi max 30 hari atau gunakan logic aman
    while (loopDate <= end) {
      const dateKey = loopDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }); 
      chartDataMap[dateKey] = 0;
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // Isi data
    ordersForGraph.forEach(order => {
      // Pastikan parsing tanggal order sesuai
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      
      // Jika key ada di map (masuk range), tambahkan. Jika tidak (karena beda jam sedikit), abaikan atau masukkan ke tanggal terdekat
      if (chartDataMap[dateKey] !== undefined) {
        chartDataMap[dateKey] += Number(order.totalAmount);
      } else {
         // Fallback: kadang date string beda sedikit, kita bisa coba cari key manual atau biarkan (opsional)
      }
    });

    const chartData = Object.keys(chartDataMap).map(key => ({
      name: key,
      total: chartDataMap[key],
    }));

    // 5. Top Menu
    const topItems = await prisma.orderItem.groupBy({
      by: ['menuId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

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

    // 6. Recent Orders
    const recentOrdersList = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } }
      }
    });

    return NextResponse.json({
      revenue: revenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      totalMenu,
      chartData, 
      topMenus,       
      recentOrdersList 
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}