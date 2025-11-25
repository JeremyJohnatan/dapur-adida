"use client"; // Wajib ada agar bisa cek status login

import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; // Import hook session
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChefHat, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Star,
  LogOut,
  User,
  LayoutDashboard
} from "lucide-react";

export default function LandingPage() {
  // Ambil data session (status login user)
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* ===== 1. NAVBAR (Navigasi Atas) ===== */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <ChefHat className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dapur Adida.</span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <Link href="#menu" className="hover:text-primary transition-colors">Menu</Link>
            <Link href="#layanan" className="hover:text-primary transition-colors">Layanan</Link>
            <Link href="#testimoni" className="hover:text-primary transition-colors">Testimoni</Link>
          </div>

          {/* LOGIKA LOGIN/LOGOUT DISINI */}
          <div className="flex items-center gap-3">
            
            {status === "loading" ? (
              // 1. Saat Loading (Sedang mengecek)
              <span className="text-sm text-slate-400 animate-pulse">Memuat...</span>
            ) : session ? (
              // 2. JIKA SUDAH LOGIN (Tampilkan Nama User)
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-full border border-slate-200">
                  <User className="h-4 w-4 text-primary" />
                  {/* Tampilkan Nama/Username */}
                  <span className="capitalize">{session.user?.name || "Kak"}</span>
                </div>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => signOut({ callbackUrl: "/" })} // Fungsi Logout & Redirect ke Home
                  className="rounded-full px-4 h-9"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </Button>
              </div>
            ) : (
              // 3. JIKA BELUM LOGIN (Tampilkan tombol Masuk/Daftar)
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-6">
                    Daftar
                  </Button>
                </Link>
              </>
            )}

          </div>
        </div>
      </nav>

      {/* ===== 2. HERO SECTION ===== */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm border-slate-300 bg-slate-50 text-slate-600">
            ✨ Katering Harian & Prasmanan Terbaik
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Rasa Bintang Lima, <br />
            <span className="text-slate-400">Harga Kaki Lima.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Nikmati hidangan lezat, higienis, dan bergizi tanpa repot memasak. 
            Cocok untuk makan siang kantor, acara keluarga, atau bekal harian.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Ubah tombol hero: Kalau login -> Ke Menu, Kalau belum -> Daftar */}
            <Link href={session ? "#menu" : "/register"}>
              <Button size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto">
                {session ? "Pesan Makanan" : "Pesan Sekarang"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#menu">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto">
                Lihat Menu Hari Ini
              </Button>
            </Link>
          </div>

          {/* Statistik Singkat */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t pt-8">
            <div>
              <p className="text-3xl font-bold text-primary">5k+</p>
              <p className="text-sm text-slate-500">Pelanggan Puas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">50+</p>
              <p className="text-sm text-slate-500">Menu Variatif</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-slate-500">Jaminan Halal</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">4.9</p>
              <p className="text-sm text-slate-500">Rating Google</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. FEATURES ===== */}
      <section id="layanan" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Kami tidak hanya menjual makanan, tapi juga kualitas dan kepercayaan untuk kesehatan keluarga Anda.
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

      {/* ===== 4. MENU PREVIEW ===== */}
      <section id="menu" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Menu Favorit</h2>
              <p className="text-slate-600">Paling banyak dipesan minggu ini.</p>
            </div>
            <Link href="/menu" className="hidden md:block">
              <Button variant="link" className="text-primary p-0">Lihat Semua Menu &rarr;</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MenuCard 
              category="Best Seller"
              title="Ayam Bakar Madu"
              desc="Ayam kampung bakar dengan olesan madu hutan, lengkap dengan lalapan dan sambal terasi."
              price="Rp 25.000"
            />
            <MenuCard 
              category="Healthy"
              title="Salmon Teriyaki"
              desc="Salmon fresh panggang saus teriyaki dengan nasi merah dan brokoli kukus."
              price="Rp 45.000"
            />
            <MenuCard 
              category="Hemat"
              title="Paket Nasi Timbel"
              desc="Nasi timbel komplit dengan ayam goreng, tahu, tempe, dan sayur asem segar."
              price="Rp 20.000"
            />
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" className="w-full">Lihat Semua Menu</Button>
          </div>
        </div>
      </section>

      {/* ===== 5. FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4 text-white">
                <ChefHat className="h-6 w-6" />
                <span className="text-xl font-bold">Dapur Adida.</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Platform katering modern yang mengutamakan rasa, kualitas, dan kemudahan pemesanan untuk Anda.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Tautan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-white">Cara Pesan</Link></li>
                <li><Link href="#" className="hover:text-white">Karir</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Hubungi Kami</h4>
              <ul className="space-y-2 text-sm">
                <li>WhatsApp: 0812-3456-7890</li>
                <li>Email: hello@dapuradida.com</li>
                <li>Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Dapur Adida. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Komponen Kecil (Helper) ---

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="p-3 bg-slate-100 rounded-full text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function MenuCard({ category, title, desc, price }: { category: string, title: string, desc: string, price: string }) {
  return (
    <Card className="overflow-hidden border-none shadow-md group cursor-pointer">
      {/* Placeholder Gambar Makanan (Kotak Abu-abu) */}
      <div className="h-48 bg-slate-200 w-full relative flex items-center justify-center text-slate-400 group-hover:bg-slate-300 transition-colors">
        <span className="text-sm font-medium">Foto Menu</span>
        <Badge className="absolute top-4 left-4 bg-white/90 text-slate-900 hover:bg-white border-none shadow-sm">
          {category}
        </Badge>
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{title}</h3>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md">
            <Star className="h-3 w-3 fill-current" /> 4.8
          </div>
        </div>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{desc}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">{price}</span>
          <Button size="sm" variant="secondary" className="rounded-full h-8">
            Tambah +
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}