"use client";

import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link"; 
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ChefHat, Clock, XCircle, StickyNote, MessageCircle, MapPin, Phone, Mail, Edit2, Check, X } from "lucide-react"; 
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
  note?: string | null;
  address?: string | null;
  deliveryTime?: string | null;
  user: { id: string; fullName: string; email: string; phoneNumber?: string }; 
  items: OrderItem[];
}

// Memoized Order Card Component
const OrderCard = memo(({ 
  order, 
  editingOrderId, 
  editAddress, 
  editDeliveryTime,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onStatusChange,
  onAddressChange,
  onDeliveryTimeChange,
  formatRupiah,
  formatDeliveryTime,
  getStatusBadge
}: {
  order: Order;
  editingOrderId: string | null;
  editAddress: string;
  editDeliveryTime: string;
  onStartEdit: (order: Order) => void;
  onCancelEdit: () => void;
  onSaveEdit: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onAddressChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onDeliveryTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatRupiah: (price: string | number) => string;
  formatDeliveryTime: (dateTimeStr: string | null | undefined) => string | null;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  const isEditing = editingOrderId === order.id;

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          
          {/* Info Pemesan */}
          <div className="space-y-1 min-w-0 flex-1 md:max-w-xs">
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

            {/* Info Kontak Pelanggan */}
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              {order.user?.phoneNumber && order.user.phoneNumber !== "-" && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{order.user.phoneNumber}</span>
                </div>
              )}
              {order.user?.email && order.user.email !== "-" && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{order.user.email}</span>
                </div>
              )}
            </div>

            {/* Alamat Pengiriman */}
            {isEditing ? (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2">Edit Alamat Pengiriman:</p>
                  <textarea
                    value={editAddress}
                    onChange={onAddressChange}
                    className="w-full p-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white whitespace-pre-wrap break-words"
                    rows={3}
                  />
                </div>
              </div>
            ) : order.address ? (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 w-full">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">Alamat Pengiriman:</p>
                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap break-all">{order.address}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => onStartEdit(order)}
                    className="mt-2 p-1 hover:bg-blue-100 rounded text-blue-600 flex-shrink-0"
                    title="Edit alamat"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : null}

            {/* Waktu Pengiriman */}
            {isEditing ? (
              <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-purple-700 uppercase mb-2">Edit Waktu Pengiriman:</p>
                  <input
                    type="datetime-local"
                    value={editDeliveryTime}
                    onChange={onDeliveryTimeChange}
                    className="w-full p-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>
            ) : order.deliveryTime ? (
              <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200 w-full">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-purple-700 uppercase mb-0.5">Waktu Pengiriman Diinginkan:</p>
                    <p className="text-sm text-purple-900 font-semibold break-words">{formatDeliveryTime(order.deliveryTime)}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => onStartEdit(order)}
                    className="mt-2 p-1 hover:bg-purple-100 rounded text-purple-600 flex-shrink-0"
                    title="Edit waktu"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : null}

            {/* Edit Action Buttons */}
            {isEditing && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onSaveEdit(order.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" /> Simpan
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" /> Batal
                </button>
              </div>
            )}
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
              onValueChange={(val) => onStatusChange(order.id, val)}
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
  );
});

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editDeliveryTime, setEditDeliveryTime] = useState("");

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

  // Edit address & delivery time
  const startEditOrder = useCallback((order: Order) => {
    setEditingOrderId(order.id);
    setEditAddress(order.address || "");
    setEditDeliveryTime(order.deliveryTime || "");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingOrderId(null);
    setEditAddress("");
    setEditDeliveryTime("");
  }, []);

  const saveEdit = useCallback(async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, address: editAddress, deliveryTime: editDeliveryTime }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, address: editAddress, deliveryTime: editDeliveryTime } : o
        ));
        setEditingOrderId(null);
        alert("Pesanan berhasil diupdate!");
      } else {
        console.error("Error response:", data);
        alert("Gagal update pesanan: " + (data.message || "Terjadi kesalahan"));
      }
    } catch (error) {
      console.error("Gagal update order:", error);
      alert("Gagal update pesanan");
    }
  }, [editAddress, editDeliveryTime]);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditAddress(e.target.value);
  }, []);

  const handleDeliveryTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditDeliveryTime(e.target.value);
  }, []);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(price));
  };

  const formatDeliveryTime = (dateTimeStr: string | null | undefined) => {
    if (!dateTimeStr) return null;
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('id-ID', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateTimeStr;
    }
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
            <OrderCard
              key={order.id}
              order={order}
              editingOrderId={editingOrderId}
              editAddress={editAddress}
              editDeliveryTime={editDeliveryTime}
              onStartEdit={startEditOrder}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
              onStatusChange={handleStatusChange}
              onAddressChange={handleAddressChange}
              onDeliveryTimeChange={handleDeliveryTimeChange}
              formatRupiah={formatRupiah}
              formatDeliveryTime={formatDeliveryTime}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}
    </div>
  );
}