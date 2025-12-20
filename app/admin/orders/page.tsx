"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; 
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ChefHat, Clock, XCircle, StickyNote, MessageCircle } from "lucide-react"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipe data
interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menu: { name: string };
}

interface Order {
  id: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  note?: string | null; // Pastikan tipe data note ada
  user: { id: string; fullName: string; email: string }; 
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) setOrders(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update Status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
    } catch (error) {
      console.error("Gagal update status");
      fetchOrders(); 
    }
  };

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(price));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Menunggu</Badge>;
      case "PROCESSING": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><ChefHat className="w-3 h-3 mr-1"/> Dimasak</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Selesai</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Batal</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Pesanan Masuk</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm">Refresh Data</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Belum ada pesanan masuk.</div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  
                  {/* Info Pemesan */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(-5).toUpperCase()}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    {/* Nama User & Link Chat Admin */}
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-800">{order.user?.fullName}</h3>
                        
                        <Link href={`/admin/chat?userId=${order.user?.id}`} title="Chat Pelanggan">
                            <div className="bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full text-blue-600 transition-colors cursor-pointer">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                        </Link>
                    </div>

                    <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                  </div>

                  {/* Detail Item & Notes */}
                  <div className="flex-1 bg-slate-50 p-4 rounded-lg text-sm space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.menu.name}</span>
                        <span className="font-medium">{formatRupiah(Number(item.price) * item.quantity)}</span>
                      </div>
                    ))}

                    {/* === BAGIAN NOTES === */}
                    {/* Notes hanya muncul jika order.note tidak kosong */}
                    {order.note && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2 items-start text-amber-700 bg-amber-50/50 p-2 rounded-md animate-in fade-in">
                            <StickyNote className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <span className="font-bold text-xs uppercase block text-amber-800 mb-0.5">Catatan Pembeli:</span>
                                <p className="italic text-slate-700">"{order.note}"</p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold text-slate-800">
                      <span>Total</span>
                      <span>{formatRupiah(order.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Action Status */}
                  <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                    <span className="text-xs font-medium text-slate-500">Ubah Status:</span>
                    <Select 
                      defaultValue={order.status} 
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Menunggu</SelectItem>
                        <SelectItem value="PROCESSING">Sedang Dimasak</SelectItem>
                        <SelectItem value="COMPLETED">Selesai / Diantar</SelectItem>
                        <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}