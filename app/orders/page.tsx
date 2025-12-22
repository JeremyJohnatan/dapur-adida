"use client";

import { useEffect, useState, useCallback } from "react"; 
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext"; 
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
  RefreshCcw,
  Star
} from "lucide-react";
import { pusherClient } from "@/lib/pusher";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menu: { id: string; name: string; imageUrl: string };
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

  // State untuk Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cek Login
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- FUNGSI FETCH DATA ---
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe ke Pusher untuk notifikasi real-time
  useEffect(() => {
    if (session?.user?.id) {
      const channel = pusherClient.subscribe(`order-updates-${session.user.id}`);

      channel.bind('status-update', (data: any) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === data.orderId ? { ...order, status: data.status } : order
          )
        );
        alert(data.message);
      });

      return () => {
        pusherClient.unsubscribe(`order-updates-${session.user.id}`);
      };
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      const channel = pusherClient.subscribe(`order-updates-${session.user.id}`);

      channel.bind('status-update', (data: any) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === data.orderId ? { ...order, status: data.status } : order
          )
        );
        alert(data.message);
      });

      return () => {
        pusherClient.unsubscribe(`order-updates-${session.user.id}`);
      };
    }
  }, [session]);

  // --- FUNGSI CEK STATUS ---
  const handleCheckPayment = async (orderId: string, manual: boolean = true) => {
    if (manual) setCheckingId(orderId); 

    try {
      const res = await fetch("/api/orders/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      
      const data = await res.json();
      
      if (data.status === "PAID") {
        if (manual) alert("✅ Pembayaran Berhasil! Pesanan sedang diproses.");
        fetchOrders(); 
      } else {
        if (manual) alert("⚠️ Pembayaran belum terkonfirmasi. Pastikan Anda sudah menyelesaikan pembayaran.");
      }
    } catch (error) {
      if (manual) alert("Gagal mengecek status.");
    } finally {
      if (manual) setCheckingId(null);
    }
  };

  // --- FUNGSI REVIEW ---
  const handleReviewSubmit = async () => {
    if (!selectedItem) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: selectedItem.menu.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        alert("Review berhasil dikirim!");
        setReviewModalOpen(false);
        setReviewComment("");
        setReviewRating(5);
      } else {
        alert("Gagal mengirim review.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewModal = (item: OrderItem) => {
    setSelectedItem(item);
    setReviewModalOpen(true);
  };
  useEffect(() => {
    if (orders.length > 0) {
      const latestPendingOrder = orders.find(o => o.status === "PENDING");
      if (latestPendingOrder) {
        console.log("Auto-checking payment for:", latestPendingOrder.id);
        handleCheckPayment(latestPendingOrder.id, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length]); 

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
      
      {/* ===== NAVBAR (Update Sesuai Request) ===== */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b px-4 py-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-center relative h-10"> {/* h-10 agar tinggi konsisten */}
          
          {/* KIRI: Logo / Back Button */}
          <div className="absolute left-0 flex items-center">
             <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium hidden sm:block">Kembali ke Home</span>
            </Link>
          </div>

          {/* TENGAH: Judul Halaman */}
          <h1 className="text-xl font-bold text-primary">Pesanan Saya</h1>

          {/* KANAN: Menu User (Tanpa Tombol 'Pesanan' karena ini halaman pesanan) */}
          <div className="absolute right-0 flex items-center gap-2 md:gap-3">
            
            {/* 1. ICON CHAT */}
            <Link href="/chat" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block" title="Chat Admin">
              <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-slate-600 hover:text-primary" />
            </Link>

            {/* 2. ICON KERANJANG */}
            <Link href="/cart" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors mr-1">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-slate-600 hover:text-primary" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* 3. USER PROFILE */}
            <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
              <User className="h-4 w-4" />
              <span className="capitalize truncate max-w-[100px]">{session?.user?.name || "Kakak"}</span>
            </div>
            
            {/* 4. TOMBOL KELUAR (Dengan Konfirmasi) */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Keluar"
                >
                  <LogOut className="h-5 w-5" /> 
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin keluar dari akun?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                  >
                    Ya, Keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
                          {order.status === "COMPLETED" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-1 text-xs h-6"
                              onClick={() => openReviewModal(item)}
                            >
                              <Star className="h-3 w-3 mr-1" /> Beri Review
                            </Button>
                          )}
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
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleCheckPayment(order.id, true)} 
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

      {/* Modal Review */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Beri Review untuk {selectedItem?.menu.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Komentar (Opsional)</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Bagaimana pendapat Anda tentang menu ini?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Batal</Button>
            <Button onClick={handleReviewSubmit} disabled={submittingReview}>
              {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Kirim Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}