"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // Pastikan install textarea: pnpm dlx shadcn@latest add textarea
import { Loader2, ArrowLeft, Save, User, MapPin, Phone } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "", // Read only
    phoneNumber: "",
    address: "",
  });

  // Redirect jika belum login
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch Data User
  useEffect(() => {
    if (session?.user) {
      const fetchProfile = async () => {
        try {
          const res = await fetch("/api/profile");
          const data = await res.json();
          if (res.ok) {
            setFormData({
              fullName: data.fullName || "",
              username: data.username || "",
              phoneNumber: data.phoneNumber || "",
              address: data.address || "",
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
        }),
      });

      if (res.ok) {
        alert("Profil berhasil diperbarui! ✅");
        router.refresh(); // Refresh agar session di navbar ikut update (jika nama berubah)
      } else {
        alert("Gagal update profil.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Navbar Simpel */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b px-4 py-4 shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium hidden sm:block">Kembali ke Home</span>
          </Link>
          <h1 className="text-xl font-bold text-primary">Profil Saya</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">{formData.fullName}</CardTitle>
                <CardDescription>@{formData.username}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="fullname">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="fullname" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="pl-9"
                    placeholder="Nama Lengkap Anda"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formData.phoneNumber} 
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="pl-9"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Penting untuk konfirmasi pesanan.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Pengiriman</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Textarea 
                    id="address" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="pl-9 min-h-[100px]"
                    placeholder="Contoh: Jl. Mawar No. 10, RT 01/02, Jakarta Selatan (Pagar Hitam)"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Pastikan alamat lengkap agar kurir tidak nyasar.</p>
              </div>

              <Button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold">
                {saving ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="mr-2 h-5 w-5" /> Simpan Perubahan</>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}