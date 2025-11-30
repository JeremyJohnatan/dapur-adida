"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  ShoppingBag 
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menu: { name: string; imageUrl: string };
}

interface Order {
  id: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Cek Login
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch Data Pesanan
  useEffect(() => {
    if (session?.user) {
      const fetchOrders = async () => {
        try {
          const res = await fetch("/api/orders");
          if (res.ok) setOrders(await res.json());
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [session]);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(price));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Menunggu Konfirmasi</Badge>;
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
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium hidden sm:block">Kembali ke Home</span>
          </Link>
          <h1 className="text-xl font-bold text-primary">Pesanan Saya</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="bg-slate-100 p-8 rounded-full">
              <ShoppingBag className="h-16 w-16 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700">Belum Ada Pesanan</h3>
            <p className="text-slate-500">Kamu belum pernah memesan apapun.</p>
            <Link href="/menu">
              <Button className="mt-4 bg-primary hover:bg-primary/90">Pesan Sekarang</Button>
            </Link>
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
                          {item.menu?.imageUrl ? (
                            <Image src={item.menu.imageUrl} alt={item.menu.name} fill className="object-cover" />
                          ) : (
                            <ChefHat className="h-full w-full p-4 text-slate-300" />
                          )}
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
                  
                  {/* Tombol Aksi Tambahan */}
                  <div className="mt-4 flex justify-end gap-2">
                    <Link href="/chat">
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        Hubungi Admin
                      </Button>
                    </Link>
                    {order.status === "PENDING" && (
                        // Di sini nanti bisa integrasi Payment Gateway untuk tombol 'Bayar Sekarang'
                        <Button size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700">
                           Konfirmasi Pembayaran
                        </Button>
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