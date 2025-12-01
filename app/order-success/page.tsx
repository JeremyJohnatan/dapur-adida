"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Pastikan import Button

export default function OrderSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [countdown, setCountdown] = useState(3); // Hitung mundur visual

  // FIX: Gunakan array kosong [] agar hanya jalan SEKALI saat mount
  // Jangan masukkan [clearCart] di sini untuk mencegah infinite loop
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efek untuk hitung mundur dan redirect otomatis
  useEffect(() => {
    if (countdown === 0) {
      router.push("/orders");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  // Handler manual untuk tombol
  const handleManualRedirect = () => {
    router.push("/orders");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6 animate-in zoom-in duration-500">
        <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Pembayaran Berhasil!</h1>
          <p className="text-slate-500 text-sm">
            Terima kasih sudah memesan di Dapur Adida. Kami sedang menyiapkan pesananmu.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
          <Loader2 className="h-3 w-3 animate-spin" />
          Mengalihkan otomatis dalam {countdown} detik...
        </div>

        {/* TOMBOL MANUAL (JAGA-JAGA JIKA MACET) */}
        <Button 
          onClick={handleManualRedirect} 
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-md cursor-pointer"
        >
          Lihat Pesanan Saya <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}