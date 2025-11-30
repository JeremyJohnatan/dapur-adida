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
  ChefHat 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Proteksi Halaman: Hanya ADMIN yang boleh masuk
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/"); // Tendang user biasa ke Home
    }
  }, [session, status, router]);

  if (status === "loading") return <div className="p-10 text-center">Memuat Admin Panel...</div>;
  if (!session || session.user.role !== "ADMIN") return null;

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin" },
    { name: "Pesanan Masuk", icon: <ShoppingBag size={20} />, href: "/admin/orders" },
    { name: "Manajemen Menu", icon: <Utensils size={20} />, href: "/admin/menu" },
    { name: "Live Chat", icon: <MessageSquare size={20} />, href: "/chat" }, // Chat pakai halaman yg sudah ada
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r shadow-sm fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <span className="font-extrabold text-xl text-slate-800">Admin Panel</span>
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
          <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => router.push("/")}>
            <LogOut size={18} className="mr-2" /> Keluar ke Home
          </Button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
}