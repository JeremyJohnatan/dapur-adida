"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AddressForm from "@/components/AddressForm";
import { 
  Trash2, Plus, Minus, ArrowLeft, ShoppingBag, CreditCard, Loader2, AlertCircle, 
  User, LogOut, LayoutDashboard, ClipboardList, MessageCircle 
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function CartPage() {
  const { items, removeFromCart, addToCart, decreaseQuantity, totalPrice, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!session) {
        setIsLoadingAddress(false);
        return;
      }

      try {
        const res = await fetch("/api/address");
        const data = await res.json();
        setAddress(data.address || null);
      } catch (error) {
        console.error("Error fetching address:", error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchUserAddress();
  }, [session]);

  const triggerAnimation = (id: string) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 200); 
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!session) {
      alert("Silakan login terlebih dahulu untuk memesan.");
      router.push("/login");
      return;
    }

    // VALIDASI ALAMAT WAJIB DIISI
    if (!address || address.trim() === "") {
      alert("Alamat pengiriman wajib diisi sebelum checkout. Silakan lengkapi alamat Anda terlebih dahulu.");
      return;
    }

    setIsCheckingOut(true);

    try {
      // Tambahan: Validasi stock sebelum checkout
      for (const item of items) {
        const menuRes = await fetch(`/api/menus/${item.id}`);
        const menu = await menuRes.json();
        if (item.quantity > menu.stock) {
          alert(`Stok ${menu.name} tidak cukup. Tersedia: ${menu.stock}`);
          setIsCheckingOut(false);
          return;
        }
      }

      console.log("Mengirim Order dengan Note:", note);
      console.log("Alamat Pengiriman:", address);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items,
          totalPrice: totalPrice,
          note: note,
          address: address,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal membuat pesanan");

      if (data.paymentUrl) {
        clearCart(); 
        window.location.href = data.paymentUrl; 
      } else {
        alert("Gagal mendapatkan link pembayaran.");
        setIsCheckingOut(false);
      }

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat checkout. Coba lagi.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm transition-all">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between relative">
          
          {/* LOGO & BRAND NAME (Kiri) */}
          <div className="flex-shrink-0 z-20">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Gambar Logo */}
              <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300 shadow-sm">
                <Image src="/logo_dapuradida.jpeg" alt="Logo Dapur Adida" fill className="object-cover" />
              </div>
              
              {/* TULISAN DAPUR ADIDA */}
              <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                Dapur Adida<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* BAGIAN KANAN */}
          <div className="flex items-center gap-2 md:gap-3 z-20">
            {session ? (
              <div className="flex items-center gap-2 md:gap-4">
                {isAdmin && (
                  <Link href="/admin" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors text-primary" title="Ke Dashboard Admin">
                    <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6" />
                  </Link>
                )}
                <Link href="/orders">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-700 font-bold hover:text-primary hover:bg-primary/5 px-2 md:px-4">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <span className="hidden sm:inline">Pesanan</span>
                    </Button>
                </Link>
                <Link href="/chat" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block" title="Chat Admin">
                  <MessageCircle className="h-5 w-6 md:h-6 md:w-6 text-slate-600 hover:text-primary" />
                </Link>

                {/* === DROPDOWN MENU PROFILE === */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 pl-3 pr-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                      <User className="h-4 w-4" />
                      <span className="capitalize truncate max-w-[100px] hidden md:inline">{session.user?.name || "Kakak"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-slate-100 shadow-xl">
                    <DropdownMenuLabel className="font-bold text-slate-900">Akun Saya</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer focus:bg-slate-50 focus:text-primary font-medium">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    
                    {/* Logout Logic inside Dropdown */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 font-medium">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Keluar</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                          <AlertDialogDescription>Apakah Anda yakin ingin keluar dari akun?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => signOut({ callbackUrl: "/" })} className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white">Ya, Keluar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </DropdownMenuContent>
                </DropdownMenu>
                {/* === END DROPDOWN === */}

              </div>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/5 font-semibold">Masuk</Button></Link>
                <Link href="/register"><Button size="sm" className="rounded-full px-4 md:px-6 bg-primary hover:bg-primary/90 shadow-lg font-bold">Daftar</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* NAVBAR SECONDARY */}

      {/* NAVBAR SECONDARY */}
      <nav className="sticky top-20 z-40 w-full bg-white/95 backdrop-blur-md border-b px-4 py-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-center relative">
          <Link href="/menu" className="absolute left-0 flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium hidden sm:block">Lanjut Belanja</span>
          </Link>
          <h1 className="text-xl font-bold text-primary">Keranjang Pesanan</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="bg-slate-100 p-8 rounded-full animate-pulse">
              <ShoppingBag className="h-16 w-16 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700">Keranjang Masih Kosong</h3>
            <p className="text-slate-500">Yuk, cari makanan enak di menu kami!</p>
            <Link href="/menu">
              <Button className="mt-4 rounded-full px-8 bg-primary hover:bg-primary/90">Lihat Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* FORM ALAMAT PENGIRIMAN - WAJIB DIISI */}
            {!isLoadingAddress && (
              <AddressForm 
                onAddressSaved={setAddress}
                initialAddress={address || undefined}
              />
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl animate-in slide-in-from-bottom-5 fade-in duration-500"
                  style={{ animationDelay: `${index * 100}ms` }} 
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative h-20 w-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300"><ShoppingBag className="h-8 w-8" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                      <p className="text-primary font-semibold text-sm">{formatRupiah(item.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-50 rounded-full p-1 border border-slate-200">
                      <button 
                        onClick={() => { decreaseQuantity(item.id); triggerAnimation(item.id); }} 
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-primary active:scale-90 transition-all"
                      >
                        {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4" />}
                      </button>
                      <span className={`font-bold w-4 text-center text-sm transition-all duration-200 ${animatingId === item.id ? "scale-150 text-green-600" : "scale-100 text-slate-900"}`}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => { addToCart(item); triggerAnimation(item.id); }} 
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-90 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* INPUT TEXTAREA CATATAN PESANAN */}
            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2 border border-slate-100">
              <label htmlFor="note" className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-700 p-1 rounded">Catatan Pesanan</span> (Opsional)
              </label>
              <textarea
                id="note"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none bg-slate-50 placeholder:text-slate-400"
                placeholder="Contoh: Jangan terlalu pedas, kuah dipisah, minta sendok..."
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* ALERT JIKA ALAMAT KOSONG */}
            {!address && !isLoadingAddress && items.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Alamat Belum Diisi</h4>
                  <p className="text-sm text-red-700 mt-1">Lengkapi alamat pengiriman di atas untuk melanjutkan ke pembayaran.</p>
                </div>
              </div>
            )}

            <Card className="border-none shadow-lg bg-white rounded-2xl sticky bottom-4 animate-in slide-in-from-bottom-10 fade-in duration-700">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Total Pembayaran</span>
                  <span className="text-primary">{formatRupiah(totalPrice)}</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={clearCart} disabled={isCheckingOut} className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl">
                    <Trash2 className="h-4 w-4 mr-2" /> Kosongkan
                  </Button>
                  <Button 
                    onClick={handleCheckout} 
                    disabled={isCheckingOut || !address || address.trim() === ""} 
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</> : <><CreditCard className="h-4 w-4 mr-2" /> Bayar Sekarang</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}