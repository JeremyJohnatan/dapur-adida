"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  MessageSquare, 
  LogOut,
  ChefHat,
  Menu, // Icon Burger Menu
  X     // Icon Close
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // State untuk Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Proteksi Halaman: Hanya ADMIN yang boleh masuk
  useEffect(() => {
    // @ts-ignore
    if (status === "loading") return;
    // @ts-ignore
    if (!session || session.user.role !== "ADMIN") {
      router.push("/"); // Tendang user biasa ke Home
    }
  }, [session, status, router]);

  // Tutup menu mobile otomatis saat pindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // @ts-ignore
  if (status === "loading") return <div className="p-10 text-center">Memuat Admin Panel...</div>;
  // @ts-ignore
  if (!session || session.user.role !== "ADMIN") return null;

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin" },
    { name: "Pesanan Masuk", icon: <ShoppingBag size={20} />, href: "/admin/orders" },
    { name: "Manajemen Menu", icon: <Utensils size={20} />, href: "/admin/menu" },
    { name: "Live Chat", icon: <MessageSquare size={20} />, href: "/chat" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* --- MOBILE HEADER (Hanya muncul di HP) --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b p-4 flex items-center justify-between z-30 shadow-sm h-16">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <span className="font-extrabold text-lg text-slate-800">Admin Panel</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed h-full bg-white border-r shadow-sm z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:flex
      `}>
        <div className="p-6 border-b flex items-center gap-2 h-20 md:h-auto">
          <div className="bg-primary/10 p-2 rounded-lg">
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <span className="font-extrabold text-xl text-slate-800">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? "bg-primary text-white shadow-md font-bold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                }`}>
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => router.push("/")}>
            <LogOut size={18} className="mr-2" /> Keluar ke Home
          </Button>
        </div>
      </aside>

      {/* Overlay Gelap (Hanya muncul di HP saat menu terbuka) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- CONTENT AREA --- */}
      {/* pt-20 digunakan di mobile agar konten tidak tertutup header */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all">
        {children}
      </main>
    </div>
  );
}