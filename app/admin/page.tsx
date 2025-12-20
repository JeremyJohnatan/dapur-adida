"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Utensils, 
  TrendingUp, 
  Loader2,
  Trophy,
  Clock,
  Info,
  Calendar as CalendarIcon, 
  Filter,
  AlertCircle // Icon untuk error
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- STATE TANGGAL ---
  // Default: 7 Hari Terakhir
  const todayStr = new Date().toISOString().split('T')[0];
  const last7DaysStr = new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(last7DaysStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Fungsi Fetch Data
  const fetchStats = async (start: string, end: string) => {
    setErrorMsg(null); // Reset error
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?startDate=${start}&endDate=${end}`);
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pertama kali saat load page
  useEffect(() => {
    fetchStats(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LOGIKA VALIDASI MAX 7 HARI ---
  const handleFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Cek jika Tanggal Akhir lebih kecil dari Tanggal Awal
    if (end < start) {
      setErrorMsg("Tanggal akhir tidak boleh lebih kecil dari tanggal awal.");
      return;
    }

    // 2. Hitung selisih hari
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // 3. Validasi Max 7 Hari (diffDays dihitung selisih, jadi range 7 hari itu selisihnya 6)
    // Contoh: Tgl 1 s/d Tgl 7 = 7 Hari (selisih 6 hari). Kita toleransi sampai selisih 7 (8 hari total) atau ketat 6.
    // User minta "max 7 hari", mari kita buat batas selisihnya 6 (sehingga total 7 hari inklusif).
    if (diffDays > 6) { 
      setErrorMsg(`Rentang tanggal terlalu lama (${diffDays + 1} hari). Maksimal 7 hari.`);
      return;
    }

    // Jika lolos validasi, ambil data
    fetchStats(startDate, endDate);
  };

  // Tombol Preset (Pintas)
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    
    if (days === 1) {
      // Hari Ini
      // start & end sama
    } else {
      // Mundur X hari
      start.setDate(end.getDate() - (days - 1));
    }

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];

    setStartDate(sStr);
    setEndDate(eStr);
    fetchStats(sStr, eStr);
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
  };

  if (loading && !stats) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <div className="space-y-8 p-6 md:p-8 pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Ringkasan performa bisnis Dapur Adida.</p>
        </div>

        {/* --- AREA FILTER TANGGAL --- */}
        <div className="flex flex-col items-end gap-2 w-full xl:w-auto">
          
          {/* Tombol Preset Cepat */}
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1 self-start md:self-end">
             <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => applyPreset(1)}
              className="h-8 text-xs hover:bg-white hover:shadow-sm"
            >
              Hari Ini
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => applyPreset(3)}
              className="h-8 text-xs hover:bg-white hover:shadow-sm"
            >
              3 Hari
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => applyPreset(7)}
              className="h-8 text-xs hover:bg-white hover:shadow-sm"
            >
              7 Hari Terakhir
            </Button>
          </div>

          {/* Input Manual dengan Tombol Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-lg border shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-2 px-2 w-full sm:w-auto">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm font-medium text-slate-600 outline-none cursor-pointer bg-transparent w-full"
              />
            </div>
            <span className="text-slate-300 hidden sm:block">-</span>
            <div className="flex items-center gap-2 px-2 w-full sm:w-auto">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm font-medium text-slate-600 outline-none cursor-pointer bg-transparent w-full"
              />
            </div>
            <Button size="sm" onClick={handleFilter} className="w-full sm:w-auto ml-0 sm:ml-2 bg-primary hover:bg-primary/90 h-8">
              <Filter className="w-3 h-3 mr-2" /> Terapkan
            </Button>
          </div>
          
          {/* Pesan Error Validasi */}
          {errorMsg && (
            <div className="text-xs text-red-500 font-medium flex items-center bg-red-50 px-3 py-1 rounded-md animate-in slide-in-from-top-1">
              <AlertCircle className="w-3 h-3 mr-1" /> {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* --- BAGIAN 1: KARTU RINGKASAN --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-green-500 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pendapatan</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatRupiah(stats?.revenue || 0)}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium text-green-600">
              {startDate === endDate ? "Hari Ini" : "Periode Terpilih"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pesanan</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats?.totalOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Transaksi berhasil</p>
          </CardContent>
        </Card>

        {/* Pelanggan & Menu tetap Global (Tidak kena filter tanggal) agar logis */}
        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pelanggan</CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats?.totalCustomers}</div>
            <p className="text-xs text-slate-500 mt-1">Total akun terdaftar</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Menu Aktif</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full">
              <Utensils className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats?.totalMenu}</div>
            <p className="text-xs text-slate-500 mt-1">Siap dipesan</p>
          </CardContent>
        </Card>
      </div>

      {/* --- BAGIAN 2: GRAFIK PENJUALAN --- */}
      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-5 w-5 text-primary" /> 
            Grafik Penjualan
          </CardTitle>
          <CardDescription>
            Menampilkan data dari <strong>{new Date(startDate).toLocaleDateString('id-ID')}</strong> sampai <strong>{new Date(endDate).toLocaleDateString('id-ID')}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Rp${value/1000}k`}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatRupiah(value)}
                />
                <Bar dataKey="total" fill="#7f1d1d" radius={[6, 6, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- BAGIAN 3: TOP MENU & RECENT ORDERS --- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* WIDGET 1: MENU TERLARIS (ALL TIME) */}
        <Card className="shadow-sm bg-white h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Menu Terlaris
            </CardTitle>
            <CardDescription>5 Menu paling populer sepanjang masa.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topMenus?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada data penjualan.</p>
              ) : (
                stats?.topMenus?.map((menu: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-slate-200 text-slate-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" : "bg-white text-slate-500 border"
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{menu.name}</p>
                        <p className="text-xs text-slate-500">{formatRupiah(menu.price)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-white shadow-sm">
                      Terjual {menu.sold}x
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* WIDGET 2: PESANAN TERBARU */}
        <Card className="shadow-sm bg-white h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              Pesanan Terbaru
            </CardTitle>
            <CardDescription>Status 5 pesanan terakhir yang masuk.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrdersList?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada pesanan masuk.</p>
              ) : (
                stats?.recentOrdersList?.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.user?.fullName || "Guest"}</p>
                      <p className="text-xs text-slate-400">ID: #{order.id.slice(-5).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`mb-1 ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        'bg-red-100 text-red-800 hover:bg-red-100'
                      }`}>
                        {order.status}
                      </Badge>
                      <p className="text-xs font-bold text-primary">{formatRupiah(order.totalAmount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- BAGIAN 4: INFO APLIKASI --- */}
      <Card className="shadow-none border border-slate-200 bg-slate-50 mt-8">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <span>
              <strong>Dapur Adida Admin Panel</strong> &bull; Versi 1.1.0 (Live Data)
            </span>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Database Terhubung</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Realtime Chat Aktif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}