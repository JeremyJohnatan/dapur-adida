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
  stock: number;
  averageRating?: number;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk menyimpan data review per menu
  const [reviews, setReviews] = useState<Record<string, any[]>>({});
  // State untuk toggle tampil/sembunyi review per menu
  const [showReviews, setShowReviews] = useState<Record<string, boolean>>({});
  
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
        
        // Fetch rating rata-rata untuk setiap menu
        const menusWithRating = await Promise.all(
          data.map(async (menu: Menu) => {
            try {
              const reviewRes = await fetch(`/api/reviews/${menu.id}`);
              const reviewData = await reviewRes.json();
              return { ...menu, averageRating: reviewData.averageRating };
            } catch (err) {
              return { ...menu, averageRating: 0 };
            }
          })
        );
        setMenus(menusWithRating);
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
    if (menu.stock <= 0) {
      alert("Stok menu ini habis!");
      return;
    }
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

  // Fungsi untuk toggle reviews
  const toggleReviews = async (menuId: string) => {
    // Jika data review belum ada di state, fetch dulu
    if (!reviews[menuId]) {
      try {
        const res = await fetch(`/api/reviews/${menuId}`);
        const data = await res.json();
        setReviews((prev) => ({ ...prev, [menuId]: data.reviews }));
      } catch (error) {
        console.error("Gagal ambil review", error);
      }
    }
    // Toggle state tampil/sembunyi
    setShowReviews((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
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
                {/* Bagian Gambar */}
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
                  
                  {(!menu.isAvailable || menu.stock <= 0) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                      <Badge variant="destructive" className="text-lg px-6 py-2 font-bold uppercase tracking-widest shadow-lg">Sold Out</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  {/* Judul & Rating Header */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{menu.name}</h3>
                    {menu.stock <= 0 ? (
                      <Badge variant="destructive" className="text-xs px-2 py-1 font-bold">Sold Out</Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 shrink-0">
                        <Star className="h-3 w-3 fill-current" /> {menu.averageRating?.toFixed(1) || 0}
                      </div>
                    )}
                  </div>
                  
                  {/* Deskripsi */}
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                    {menu.description || "Menu spesial dengan cita rasa otentik khas Dapur Adida."}
                  </p>
                  <div className="mb-2 text-xs text-slate-600">
                    {menu.stock > 0 ? `Tersedia: ${menu.stock}` : <span className="text-red-600 font-bold">Stok Habis</span>}
                  </div>
                  
                  {/* Bagian Review Trigger */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < (menu.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-600">({menu.averageRating?.toFixed(1) || 0})</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleReviews(menu.id)}>
                      {showReviews[menu.id] ? "Tutup Review" : "Lihat Review"}
                    </Button>
                  </div>

                  {/* --- BAGIAN LIST REVIEW (YANG DIPERBAIKI) --- */}
                  {showReviews[menu.id] && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto">
                      {reviews[menu.id] && reviews[menu.id].length > 0 ? (
                        reviews[menu.id].map((review) => (
                          <div key={review.id} className="border-b last:border-0 border-slate-200 pb-2 mb-2 last:mb-0 last:pb-0">
                            <div className="flex items-center mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="ml-2 text-xs font-semibold text-slate-700">
                                {review.user?.fullName || "User"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 italic">"{review.comment}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-center text-slate-400 py-2">Belum ada review untuk menu ini.</p>
                      )}
                    </div>
                  )}
                  
                  {/* Harga & Button Beli */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                    <span className="font-black text-xl text-primary">
                      {formatRupiah(menu.price)}
                    </span>
                    
                    <Button 
                      size="sm" 
                      disabled={!menu.isAvailable || menu.stock <= 0}
                      onClick={() => handleAddToCart(menu)} 
                      className={`rounded-full px-6 transition-all font-bold h-10 shadow-lg active:scale-95 duration-300 ${
                        menu.stock <= 0
                          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                          : addedItems[menu.id] 
                            ? "bg-green-600 hover:bg-green-700 text-white w-32" 
                            : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:shadow-primary/30 w-28"
                      }`}
                    >
                      {menu.stock <= 0 ? (
                        "Sold Out"
                      ) : addedItems[menu.id] ? (
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