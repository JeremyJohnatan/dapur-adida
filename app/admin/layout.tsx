"use client";

import Link from "next/link";
import Image from "next/image"; // 1. Import Image
import { useSession, signOut } from "next-auth/react"; 
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  MessageSquare, 
  LogOut,
  ChefHat,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Proteksi Halaman: Hanya ADMIN yang boleh masuk
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session?.user?.role !== "ADMIN") {
      router.push("/"); 
    }
  }, [session, status, router]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === "loading") return <div className="p-10 text-center">Memuat Admin Panel...</div>;
  if (!session || session?.user?.role !== "ADMIN") return null;

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin" },
    { name: "Pesanan Masuk", icon: <ShoppingBag size={20} />, href: "/admin/orders" },
    { name: "Manajemen Menu", icon: <Utensils size={20} />, href: "/admin/menu" },
    { name: "Live Chat", icon: <MessageSquare size={20} />, href: "/admin/chat" }, 
  ];

  const SidebarContent = () => (
    <>
      {/* LOGO DESKTOP - SEKARANG PAKAI GAMBAR */}
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-100">
             <Image 
               src= "/logo_dapuradida.jpeg"
               alt="Logo Admin" 
               fill
               className="object-cover"
               sizes="40px"
             />
          </div>
          <span className="font-extrabold text-xl text-slate-800">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
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
        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut size={18} className="mr-2" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-20 px-4 py-3 flex items-center justify-between">
        
        {/* LOGO MOBILE - PAKAI GAMBAR JUGA */}
        <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-100">
             <Image 
               src="/logo_dapuradida.jpeg"
               alt="Logo Admin" 
               fill
               className="object-cover"
               sizes="32px"
             />
          </div>
          <span className="font-extrabold text-lg text-slate-800">Admin Panel</span>
        </Link>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside className={`
        md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white border-r shadow-sm fixed h-full z-10 hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 md:ml-64 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  );
}