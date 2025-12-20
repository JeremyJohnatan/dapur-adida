"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, ShoppingCart, ChefHat, Star, Plus, Check, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Definisikan tipe data Menu
interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addToCart, totalItems } = useCart(); 

  // --- STATE ANIMASI & NOTIFIKASI ---
  const [isCartBumping, setIsCartBumping] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  
  // State untuk Pop-up Notifikasi
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch("/api/menus");
        const data = await res.json();
        setMenus(data);
      } catch (error) {
        console.error("Gagal ambil menu", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // --- FUNGSI HANDLE ADD TO CART ---
  const handleAddToCart = (menu: any) => {
    // 1. Masukkan ke Context
    addToCart(menu);

    // 2. Tampilkan Pop-up Notifikasi
    setToast({ show: true, message: `Berhasil menambahkan ${menu.name}!` });
    
    // Hilangkan pop-up setelah 2 detik
    setTimeout(() => {
      setToast(null);
    }, 2000);

    // 3. Animasi Ikon Keranjang (Bump)
    setIsCartBumping(true);
    setTimeout(() => setIsCartBumping(false), 300);

    // 4. Animasi Tombol Item (Berubah Hijau)
    setAddedItems((prev) => ({ ...prev, [menu.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [menu.id]: false }));
    }, 1000);
  };

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- POP-UP NOTIFIKASI (TOAST) --- */}
      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-green-500 rounded-full p-1">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b px-4 py-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-medium">
            <ArrowLeft className="h-5 w-5" />
            <span>Kembali</span>
          </Link>
          
          <h1 className="text-xl font-bold text-primary">Daftar Menu</h1>
          
          {/* Ikon Keranjang dengan Animasi Bump */}
          <Link href="/cart" className="relative cursor-pointer p-2">
            <div className={`transition-transform duration-300 ${isCartBumping ? "scale-125 text-primary" : "scale-100 text-slate-600 hover:text-primary"}`}>
               <ShoppingCart className="h-6 w-6" />
            </div>
            
            {totalItems > 0 && (
              <span className={`absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 ${isCartBumping ? "scale-125" : "scale-100"}`}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-500 font-medium animate-pulse">Menyiapkan menu lezat...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {menus.map((menu, index) => (
              <Card 
                key={menu.id} 
                className="overflow-hidden border-none shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group bg-white rounded-3xl animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                  {menu.imageUrl ? (
                    <Image 
                      src={menu.imageUrl} 
                      alt={menu.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 bg-slate-50">
                      <ChefHat className="h-12 w-12 mb-2 opacity-50" />
                      <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                    </div>
                  )}
                  
                  {!menu.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                      <Badge variant="destructive" className="text-lg px-6 py-2 font-bold uppercase tracking-widest shadow-lg">Habis</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{menu.name}</h3>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 shrink-0">
                      <Star className="h-3 w-3 fill-current" /> 4.8
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                    {menu.description || "Menu spesial dengan cita rasa otentik khas Dapur Adida."}
                  </p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="font-black text-xl text-primary">
                      {formatRupiah(menu.price)}
                    </span>
                    
                    {/* Tombol Tambah dengan Efek Ganti Teks */}
                    <Button 
                      size="sm" 
                      disabled={!menu.isAvailable}
                      onClick={() => handleAddToCart(menu)} 
                      className={`rounded-full px-6 transition-all font-bold h-10 shadow-lg active:scale-95 duration-300 ${
                        addedItems[menu.id] 
                          ? "bg-green-600 hover:bg-green-700 text-white w-32" 
                          : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:shadow-primary/30 w-28"
                      }`}
                    >
                      {addedItems[menu.id] ? (
                         <>
                           <Check className="h-4 w-4 mr-1 animate-in zoom-in spin-in-90 duration-300" /> Masuk
                         </>
                      ) : (
                         <>
                           <Plus className="h-4 w-4 mr-1" /> Tambah
                         </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}