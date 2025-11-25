"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeFromCart, addToCart, decreaseQuantity, totalPrice, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Fungsi Checkout Sederhana (Ke WhatsApp)
  const handleCheckout = () => {
    if (!session) {
      alert("Silakan login terlebih dahulu untuk memesan.");
      router.push("/login");
      return;
    }

    // Format pesan untuk WhatsApp
    let message = `Halo Dapur Adida, saya *${session.user?.name}* ingin memesan:\n\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - ${formatRupiah(item.price * item.quantity)}\n`;
    });
    message += `\n*Total: ${formatRupiah(totalPrice)}*`;
    message += `\n\nMohon diproses ya!`;

    // Encode URL dan buka WhatsApp
    const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    
    // Opsional: Kosongkan keranjang setelah pesan
    // clearCart(); 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b px-4 py-4 shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="localhost:3000" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
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
            {/* List Item */}
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Gambar Kecil */}
                    <div className="relative h-20 w-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Info Produk */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                      <p className="text-primary font-semibold text-sm">{formatRupiah(item.price)}</p>
                    </div>

                    {/* Kontrol Quantity */}
                    <div className="flex items-center gap-3 bg-slate-50 rounded-full p-1 border border-slate-200">
                      <button 
                        onClick={() => decreaseQuantity(item.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-primary active:scale-90 transition-all"
                      >
                        {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4" />}
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-90 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Ringkasan Harga */}
            <Card className="border-none shadow-lg bg-white rounded-2xl sticky bottom-4">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Total Pembayaran</span>
                  <span className="text-primary">{formatRupiah(totalPrice)}</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={clearCart}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Kosongkan
                  </Button>
                  <Button 
                    onClick={handleCheckout}
                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Pesan via WhatsApp
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