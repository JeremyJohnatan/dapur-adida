"use client";

import { useEffect, useState, useCallback } from "react"; // Tambah useCallback
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Clock, 
  ChefHat, 
  CheckCircle, 
  XCircle, 
  ShoppingBag,
  ShoppingCart, 
  MessageCircle, 
  User, 
  LogOut,
  CreditCard, 
  RefreshCcw 
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menu: { name: string; imageUrl: string };
}

interface Payment {
  paymentUrl: string;
  status: string;
}

interface Order {
  id: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment; 
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const { totalItems } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Cek Login
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- 1. FUNGSI FETCH DATA (Dibungkus useCallback agar stabil) ---
  const fetchOrders = useCallback(async () => {
    if (session?.user) {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, [session]);

  // Panggil fetch saat pertama kali load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- 2. FUNGSI CEK STATUS (Bisa Manual / Otomatis) ---
  const handleCheckPayment = async (orderId: string, manual: boolean = true) => {
    if (manual) setCheckingId(orderId); // Tampilkan loading hanya jika diklik manual

    try {
      const res = await fetch("/api/orders/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      
      const data = await res.json();
      
      if (data.status === "PAID") {
        // Jika berhasil bayar
        if (manual) alert("✅ Pembayaran Berhasil! Pesanan sedang diproses.");
        fetchOrders(); // Refresh data otomatis agar status di layar berubah
      } else {
        // Jika belum bayar
        if (manual) alert("⚠️ Pembayaran belum terkonfirmasi. Pastikan Anda sudah menyelesaikan pembayaran.");
      }
    } catch (error) {
      if (manual) alert("Gagal mengecek status.");
    } finally {
      if (manual) setCheckingId(null);
    }
  };

  // --- 3. AUTO CHECK (Jalan Sekali saat Data Masuk) ---
  useEffect(() => {
    if (orders.length > 0) {
      // Cari pesanan terbaru yang masih PENDING
      const latestPendingOrder = orders.find(o => o.status === "PENDING");
      
      if (latestPendingOrder) {
        // Cek diam-diam (Silent Check)
        console.log("Auto-checking payment for:", latestPendingOrder.id);
        handleCheckPayment(latestPendingOrder.id, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length]); // Hanya jalan jika jumlah order berubah/termuat

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(price));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Menunggu Pembayaran</Badge>;
      case "PROCESSING": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><ChefHat className="w-3 h-3 mr-1"/> Sedang Dimasak</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Selesai / Diantar</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Dibatalkan</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b px-4 py-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium hidden sm:block">Kembali ke Home</span>
            </Link>
            <h1 className="text-xl font-bold text-primary">Pesanan Saya</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <Link href="/chat" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors" title="Chat Admin">
                <MessageCircle className="h-6 w-6 text-slate-600 hover:text-primary" />
             </Link>
             <Link href="/cart" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ShoppingCart className="h-6 w-6 text-slate-600 hover:text-primary" />
                {totalItems > 0 && <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">{totalItems}</span>}
             </Link>
             <div className="hidden md:flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                <User className="h-4 w-4" />
                <span className="capitalize truncate max-w-[100px]">{session?.user?.name || "Kakak"}</span>
             </div>
             <Button variant="destructive" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="rounded-full w-9 h-9 p-0 md:w-auto md:px-4 md:h-9 shadow-md hover:shadow-lg transition-all">
                <LogOut className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Keluar</span>
             </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="bg-slate-100 p-8 rounded-full"><ShoppingBag className="h-16 w-16 text-slate-300" /></div>
            <h3 className="text-2xl font-bold text-slate-700">Belum Ada Pesanan</h3>
            <p className="text-slate-500">Kamu belum pernah memesan apapun.</p>
            <Link href="/menu"><Button className="mt-4 bg-primary hover:bg-primary/90">Pesan Sekarang</Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-16 w-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                          {item.menu?.imageUrl ? <Image src={item.menu.imageUrl} alt={item.menu.name} fill className="object-cover" /> : <ChefHat className="h-full w-full p-4 text-slate-300" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm">{item.menu?.name}</h4>
                          <p className="text-xs text-slate-500">{item.quantity} x {formatRupiah(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800 text-sm">{formatRupiah(Number(item.price) * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Total Pembayaran</span>
                    <span className="text-lg font-black text-primary">{formatRupiah(order.totalAmount)}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Link href="/chat">
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        <MessageCircle className="h-3 w-3 mr-2" /> Hubungi Admin
                      </Button>
                    </Link>

                    {/* TOMBOL Cek Status & Bayar (Hanya Muncul Jika PENDING) */}
                    {order.status === "PENDING" && order.payment?.paymentUrl && (
                      <>
                        {/* Tombol Cek Status Manual (Jaga-jaga) */}
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleCheckPayment(order.id, true)} // True = Manual Mode (Muncul Alert)
                          disabled={checkingId === order.id}
                          className="text-xs h-8 bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                           {checkingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3 mr-1" />}
                           Cek Status
                        </Button>

                        <a href={order.payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                             <CreditCard className="h-3 w-3 mr-2" /> Bayar Sekarang
                          </Button>
                        </a>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}