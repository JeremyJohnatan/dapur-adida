"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react"; 
import { useCart } from "@/context/CartContext"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pusherClient } from "@/lib/pusher"; 
import { 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Star,
  LogOut,
  User,
  ShoppingCart, 
  ChefHat,
  Loader2,
  MessageCircle,
  Bell,
  ClipboardList,
  LayoutDashboard,
  Instagram, 
  Phone,
  Flame 
} from "lucide-react";

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

// Interface Menu
interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean; 
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const { addToCart, totalItems } = useCart();
  
  const [featuredMenus, setFeaturedMenus] = useState<Menu[]>([]); 
  const [recommendedMenus, setRecommendedMenus] = useState<Menu[]>([]); 
  const [loadingMenu, setLoadingMenu] = useState(true);
  
  const [notification, setNotification] = useState<{message: string, show: boolean} | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    const channel = pusherClient.subscribe(`chat-${userId}`);
    channel.bind("new-message", (data: any) => {
      if (data.senderId !== userId) {
        setNotification({ message: "Pesan baru dari Admin!", show: true });
        setTimeout(() => setNotification(null), 4000);
      }
    });
    return () => {
      pusherClient.unsubscribe(`chat-${userId}`);
    };
  }, [session]);

  // --- LOGIC FETCH DATA (DIPERBAIKI: HANYA 3 MENU TERLARIS) ---
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch("/api/menus"); 
        const data = await res.json();
        
        if (Array.isArray(data)) {
            // A. Menu Rekomendasi (Yang dibintang)
            const starred = data.filter((item: Menu) => item.isFeatured === true);
            
            // B. Menu Terlaris (Sisanya yang tidak dibintang)
            const others = data.filter((item: Menu) => item.isFeatured !== true);

            setRecommendedMenus(starred); 
            
            // LOGIC FIX: HANYA AMBIL 3 MENU UTAMA
            if (others.length > 0) {
                setFeaturedMenus(others.slice(0, 3)); // <-- Cuma ambil 3
            } else {
                setFeaturedMenus(data.slice(0, 3)); // Fallback cuma ambil 3
            }
        }
      } catch (error) {
        console.error("Gagal ambil menu", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenus();
  }, []);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
     }).format(Number(price));
  };

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      
      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-white border-l-4 border-primary shadow-2xl p-4 rounded-r-lg flex items-center gap-3 animate-in slide-in-from-right">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bell className="h-5 w-5 text-primary animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">Pesan Masuk</h4>
            <p className="text-xs text-slate-500">{notification.message}</p>
          </div>
          <Link href="/chat">
            <Button size="sm" className="ml-2 h-8 text-xs bg-primary hover:bg-primary/90">Lihat</Button>
          </Link>
        </div>
      )}

      {/* ===== 1. NAVBAR ===== */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm transition-all">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between relative">
          
          {/* LOGO & BRAND NAME (Kiri) */}
          <div className="flex-shrink-0 z-20">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Gambar Logo */}
              <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300 shadow-sm">
                <Image src="/logo_dapuradida.jpeg" alt="Logo Dapur Adida" fill className="object-cover" />
              </div>
              
              {/* TULISAN DAPUR ADIDA (Dipercantik) */}
              <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                Dapur Adida<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* BAGIAN KANAN (User, Cart, Login - Tetap Sama) */}
          <div className="flex items-center gap-2 md:gap-3 z-20">
            {status === "loading" ? (
              <span className="text-xs md:text-sm text-slate-400 animate-pulse">Memuat...</span>
            ) : session ? (
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
                <Link href="/cart" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors mr-2">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-slate-600 hover:text-primary" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="capitalize truncate max-w-[100px]">{session.user?.name || "Kakak"}</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Keluar">
                      <LogOut className="h-5 w-5" /> 
                    </Button>
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

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-5 lg:pb-40 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-full lg:w-[60%] h-full z-0 opacity-20 lg:opacity-100">
          <div className="relative w-full h-full">
            <Image src="/background.png" alt="Dapur Adida Catering" fill className="object-cover object-center" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent lg:via-white/20"></div>
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent hidden lg:block"></div>
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-center lg:text-left">
            <Badge variant="outline" className="mb-6 py-2 px-4 text-sm border-primary/20 bg-white/80 backdrop-blur text-primary font-bold shadow-sm rounded-full inline-flex">
              ✨ Katering Harian & Prasmanan Terbaik
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-slate-900 drop-shadow-sm">
              Rasa Bintang Lima, <br /> <span className="text-slate-400">Harga Kaki Lima.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
              Nikmati hidangan lezat, higienis, dan bergizi tanpa repot memasak. Cocok untuk makan siang kantor, acara keluarga, atau bekal harian.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
              <Link href={session ? "/menu" : "/register"} className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full w-full bg-primary hover:bg-primary/90 shadow-xl font-bold">
                  {session ? "Pesan Makanan" : "Pesan Sekarang"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-0 flex items-center justify-center lg:justify-start gap-8 lg:gap-12 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              <div className="text-center lg:text-left">
                <p className="text-3xl font-black text-primary"><CountUpAnimation target={5} suffix="k+" /></p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pelanggan</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-black text-primary"><CountUpAnimation target={4.9} decimals={1} /></p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rating</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-black text-primary"><CountUpAnimation target={100} suffix="%" /></p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Halal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. FEATURES ===== */}
      <section id="layanan" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-widest uppercase mb-3 block">Komitmen Kami</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-slate-900">
              Kenapa Harus <span className="text-primary">Dapur Adida?</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
              Kami paham bahwa makanan bukan sekadar pengisi perut, melainkan <strong>investasi kesehatan jangka panjang</strong>. 
              Oleh karena itu, Dapur Adida berkomitmen menerapkan <strong>standar kebersihan ketat</strong> dan hanya menggunakan bahan-bahan segar pilihan. 
              Percayakan kebutuhan konsumsi Anda pada kami, dan nikmati <strong>ketenangan pikiran</strong> saat menyantap hidangan yang lezat, bernutrisi, dan terjamin kualitasnya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Clock className="h-8 w-8" />}
              title="Tepat Waktu"
              desc="Armada pengiriman kami memastikan makanan sampai hangat sebelum jam makan siang Anda."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8" />}
              title="Higienis & Bersih"
              desc="Dapur standar restoran dengan koki profesional yang mengutamakan kebersihan (SOP Ketat)."
            />
            <FeatureCard 
              icon={<Truck className="h-8 w-8" />}
              title="Gratis Ongkir"
              desc="Nikmati gratis biaya pengiriman untuk area terjangkau tanpa minimum pemesanan berlebih."
            />
          </div>
        </div>
      </section>

      {/* REKOMENDASI SPESIAL (ADMIN CHOICE) - TAMPILKAN JIKA ADA DATA */}
      {recommendedMenus.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none gap-1 px-3">
                    <Flame className="h-3 w-3 fill-white" /> Pilihan Chef
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Rekomendasi Spesial</h2>
                <p className="text-slate-600 mt-2">Hidangan terbaik yang dipilih khusus untuk Anda.</p>
              </div>
              <Link href="/menu">
                <Button variant="outline" className="hidden md:flex border-slate-200 hover:bg-white hover:text-primary">Lihat Menu</Button>
              </Link>
            </div>

            {loadingMenu ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recommendedMenus.map((menu) => (
                  <Card key={menu.id} className="overflow-hidden border-none shadow-md hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 group cursor-pointer bg-white rounded-3xl">
                    <div className="h-56 bg-slate-100 w-full relative flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors overflow-hidden">
                      {menu.imageUrl ? (
                        <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <ChefHat className="h-10 w-10 opacity-30 text-primary" />
                      )}
                      <Badge className="absolute top-4 left-4 bg-orange-500 text-white border-none shadow-sm backdrop-blur-sm px-3 py-1 font-bold">
                        HOT 🔥
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{menu.name}</h3>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 shrink-0">
                          <Star className="h-3 w-3 fill-current" /> 5.0
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                        {menu.description || "Menu lezat khas Dapur Adida."}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-lg text-slate-900">{formatRupiah(menu.price)}</span>
                        <Link href={session ? "/menu" : "/login"}>
                          <Button size="sm" disabled={!menu.isAvailable} className="rounded-full h-9 px-5 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all font-bold">
                            Pesan
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* MENU TERLARIS */}
      <section id="menu" className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-slate-900">Menu Terlaris</h2>
              <p className="text-slate-600 text-lg">Paling banyak dipesan minggu ini.</p>
            </div>
            <Link href="/menu" className="hidden md:block">
              <Button variant="link" className="text-primary p-0 text-base font-bold hover:text-primary/80">
                Lihat Semua Menu &rarr;
              </Button>
            </Link>
          </div>

          {loadingMenu ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredMenus.map((menu) => (
                <Card key={menu.id} className="overflow-hidden border-none shadow-md hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 group cursor-pointer bg-white rounded-3xl">
                  <div className="h-56 bg-slate-100 w-full relative flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors overflow-hidden">
                    {menu.imageUrl ? (
                      <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <ChefHat className="h-10 w-10 opacity-30 text-primary" />
                    )}
                    <Badge className="absolute top-4 left-4 bg-white/90 text-primary hover:bg-white border-none shadow-sm backdrop-blur-sm px-3 py-1 font-bold">
                      Terlaris
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{menu.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 shrink-0">
                        <Star className="h-3 w-3 fill-current" /> 4.8
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                      {menu.description || "Menu lezat khas Dapur Adida."}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-lg text-slate-900">{formatRupiah(menu.price)}</span>
                      <Link href={session ? "/menu" : "/login"}>
                        <Button size="sm" disabled={!menu.isAvailable} className="rounded-full h-9 px-5 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all font-bold">
                          Pesan
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-10 text-center md:hidden">
            <Link href="/menu"><Button variant="outline" className="w-full border-primary text-primary font-bold">Lihat Semua Menu</Button></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6 text-white">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-slate-600">
                   <Image src="/logo_dapuradida.jpeg" alt="Logo Footer" fill className="object-cover" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Dapur Adida.</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm text-slate-400">
                Platform katering modern yang mengutamakan rasa, kualitas, dan kemudahan pemesanan untuk Anda dan keluarga.
              </p>
            </div>
            <div className="flex flex-col justify-start md:items-end">
              <h4 className="font-bold text-white mb-6 text-lg">Hubungi Kami</h4>
              <div className="text-left md:text-right space-y-2 mb-6">
                 <p className="text-slate-400 text-sm leading-relaxed">Jl. Kaliurang Barat Gang III No. 1391, Kota Malang<br/>Indonesia</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://wa.me/6285182734247" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-full gap-2 shadow-lg hover:shadow-[#25D366]/20 transition-all w-full sm:w-auto">
                    <Phone className="h-5 w-5 fill-current" /> WhatsApp
                  </Button>
                </Link>
                <Link href="https://instagram.com/jeremyjohnatan_" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-tr from-[#FFB224] via-[#FF4D4D] to-[#B235E6] hover:opacity-90 text-white font-bold rounded-full gap-2 shadow-lg border-0 transition-all w-full sm:w-auto">
                    <Instagram className="h-5 w-5" /> Instagram
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} Dapur Adida. All rights reserved.
          </div>
        </div>
      </footer>

      {session && (
        <Link href="/chat">
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
            <Button className="rounded-full h-14 px-6 bg-primary hover:bg-primary/90 text-white shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 border-4 border-white/20 backdrop-blur-sm">
              <MessageCircle className="h-6 w-6" /> <span className="font-bold text-lg hidden sm:inline">Chat Admin</span>
            </Button>
          </div>
        </Link>
      )}
    </div>
  );
}

function CountUpAnimation({ target, suffix = "", decimals = 0, duration = 2000 }: { target: number, suffix?: string, decimals?: number, duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(easeProgress * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);
  return <span>{count.toFixed(decimals)}{suffix}</span>;
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
      <div className="p-4 bg-primary/5 rounded-2xl text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}