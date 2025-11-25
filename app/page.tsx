"use client";

import Link from "next/link";
import Image from "next/image"; // Import Image untuk logo
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Star,
  LogOut,
  User,
  ChefHat // Masih dipakai untuk placeholder menu kosong
} from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* ===== 1. NAVBAR ===== */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm transition-all">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* LOGO UTAMA (GAMBAR) */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300">
              {/* Pastikan file 'logo_dapuradida.JPG' ada di folder public */}
              <Image 
                src="/logo_dapuradida.JPG" 
                alt="Logo Dapur Adida"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-primary group-hover:opacity-90 transition-opacity">
              Dapur Adida.
            </span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
            <Link href="#menu" className="hover:text-primary transition-colors">Menu</Link>
            <Link href="#layanan" className="hover:text-primary transition-colors">Layanan</Link>
            <Link href="#testimoni" className="hover:text-primary transition-colors">Testimoni</Link>
          </div>

          {/* LOGIKA LOGIN/LOGOUT */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <span className="text-sm text-slate-400 animate-pulse">Memuat...</span>
            ) : session ? (
              // JIKA SUDAH LOGIN
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                  <User className="h-4 w-4" />
                  <span className="capitalize">{session.user?.name || "Kakak"}</span>
                </div>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => signOut({ callbackUrl: "/" })} 
                  className="rounded-full px-4 h-9 shadow-md hover:shadow-lg transition-all"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </Button>
              </div>
            ) : (
              // JIKA BELUM LOGIN
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex hover:text-primary hover:bg-primary/5 font-semibold">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== 2. HERO SECTION ===== */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-white to-white">
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge variant="outline" className="mb-6 py-2 px-4 text-sm border-primary/20 bg-white text-primary font-bold shadow-sm rounded-full">
            ✨ Katering Harian & Prasmanan Terbaik
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-slate-900 drop-shadow-sm">
            Rasa Bintang Lima, <br />
            <span className="text-slate-400">Harga Kaki Lima.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Nikmati hidangan lezat, higienis, dan bergizi tanpa repot memasak. 
            Cocok untuk makan siang kantor, acara keluarga, atau bekal harian.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={session ? "#menu" : "/register"}>
              <Button size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-bold">
                {session ? "Pesan Makanan" : "Pesan Sekarang"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#menu">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto border-2 hover:bg-slate-50 hover:text-primary font-semibold">
                Lihat Menu Hari Ini
              </Button>
            </Link>
          </div>

          {/* Statistik */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-slate-200 pt-10">
            <StatItem value="5k+" label="Pelanggan Puas" />
            <StatItem value="50+" label="Menu Variatif" />
            <StatItem value="100%" label="Jaminan Halal" />
            <StatItem value="4.9" label="Rating Google" />
          </div>
        </div>
      </section>

      {/* ===== 3. FEATURES ===== */}
      <section id="layanan" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
              Kenapa Memilih <span className="text-primary">Kami?</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
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
      <section id="menu" className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-slate-900">Menu Favorit</h2>
              <p className="text-slate-600 text-lg">Paling banyak dipesan minggu ini.</p>
            </div>
            <Link href="/menu" className="hidden md:block">
              <Button variant="link" className="text-primary p-0 text-base font-bold hover:text-primary/80">
                Lihat Semua Menu &rarr;
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          
          <div className="mt-10 text-center md:hidden">
            <Button variant="outline" className="w-full border-primary text-primary font-bold">Lihat Semua Menu</Button>
          </div>
        </div>
      </section>

      {/* ===== 5. FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6 text-white">
                {/* Logo Footer */}
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-slate-600">
                   <Image 
                    src="/logo_dapuradida.JPG" 
                    alt="Logo Footer"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-2xl font-bold tracking-tight">Dapur Adida.</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm text-slate-400">
                Platform katering modern yang mengutamakan rasa, kualitas, dan kemudahan pemesanan untuk Anda dan keluarga.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Tautan</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors duration-200">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors duration-200">Cara Pesan</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors duration-200">Karir</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors duration-200">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-primary">WA:</span> 
                  <span className="hover:text-white transition-colors cursor-pointer">0812-3456-7890</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-primary">Email:</span> 
                  <span className="hover:text-white transition-colors cursor-pointer">hello@dapuradida.com</span>
                </li>
                <li className="text-slate-500 mt-2">
                  Jl. Rasa Juara No. 1<br/>Jakarta Selatan, Indonesia
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} Dapur Adida. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Komponen Kecil (Helper) ---

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-4xl font-black text-primary mb-1">{value}</p>
      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
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

function MenuCard({ category, title, desc, price }: { category: string, title: string, desc: string, price: string }) {
  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 group cursor-pointer bg-white rounded-3xl">
      {/* Placeholder Gambar Makanan */}
      <div className="h-56 bg-slate-100 w-full relative flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors overflow-hidden">
        <div className="bg-white/50 p-4 rounded-full">
          <ChefHat className="h-10 w-10 opacity-30 text-primary" />
        </div>
        <span className="absolute bottom-4 text-xs font-bold opacity-40 uppercase tracking-widest">Foto Belum Tersedia</span>
        <Badge className="absolute top-4 left-4 bg-white/90 text-primary hover:bg-white border-none shadow-sm backdrop-blur-sm px-3 py-1 font-bold">
          {category}
        </Badge>
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 shrink-0">
            <Star className="h-3 w-3 fill-current" /> 4.8
          </div>
        </div>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">{desc}</p>
        <div className="flex justify-between items-center">
          <span className="font-black text-lg text-slate-900">{price}</span>
          <Button size="sm" className="rounded-full h-9 px-5 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all font-bold">
            Tambah
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}