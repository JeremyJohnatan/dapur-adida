"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; 
import { Loader2, ArrowLeft, Save, User, MapPin, Phone, Lock, KeyRound, ShieldAlert } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "", 
    phoneNumber: "",
    address: "",
    oldPassword: "", // INPUT BARU
    password: "", 
    confirmPassword: ""
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
            setFormData(prev => ({
              ...prev,
              fullName: data.fullName || "",
              username: data.username || "",
              phoneNumber: data.phoneNumber || "",
              address: data.address || "",
            }));
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

    // 1. Validasi Password
    if (formData.password) {
        if (!formData.oldPassword) {
            alert("Harap masukkan Password Lama untuk mengganti password!");
            setSaving(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Password baru dan Konfirmasi tidak cocok!");
            setSaving(false);
            return;
        }
        if (formData.password.length < 6) {
            alert("Password baru minimal 6 karakter!");
            setSaving(false);
            return;
        }
    }

    try {
      const payload: any = {
        fullName: formData.fullName,
        username: formData.username,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      };

      // Kirim password lama dan baru hanya jika user ingin mengganti
      if (formData.password) {
        payload.password = formData.password;
        payload.oldPassword = formData.oldPassword; // Kirim ke API
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (res.ok) {
        alert("Profil berhasil diperbarui! ✅");
        // Reset field password
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "", oldPassword: "" }));
        router.refresh(); 
      } else {
        alert(responseData.message || "Gagal update profil.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
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
                <CardTitle className="text-2xl font-bold text-slate-800">{formData.fullName || "User"}</CardTitle>
                <CardDescription>Edit informasi pribadi dan keamanan akun Anda.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* BAGIAN 1: INFORMASI UMUM */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                    <User className="h-4 w-4" /> Informasi Pribadi
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullname">Nama Lengkap</Label>
                        <Input 
                        id="fullname" 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                        id="username" 
                        value={formData.username} 
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor WhatsApp</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      value={formData.phoneNumber} 
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Pengiriman</Label>
                    <Textarea 
                      id="address" 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="min-h-[80px]"
                    />
                  </div>
              </div>

              {/* BAGIAN 2: KEAMANAN (PASSWORD) */}
              <div className="space-y-4 pt-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                    <Lock className="h-4 w-4" /> Ganti Password
                  </h3>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Kosongkan jika tidak ingin mengganti password.
                      </p>

                      {/* --- INPUT PASSWORD LAMA --- */}
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">Password Lama</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input 
                                id="oldPassword" 
                                type="password"
                                value={formData.oldPassword} 
                                onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
                                className="pl-9 bg-white"
                                placeholder="Wajib diisi jika ganti password"
                            />
                        </div>
                      </div>

                      {/* --- INPUT PASSWORD BARU --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password Baru</Label>
                          <div className="relative">
                              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                  id="password" 
                                  type="password"
                                  value={formData.password} 
                                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                                  className="pl-9 bg-white"
                                  placeholder="Password baru"
                              />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Konfirmasi</Label>
                          <div className="relative">
                              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                  id="confirmPassword" 
                                  type="password"
                                  value={formData.confirmPassword} 
                                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                  className="pl-9 bg-white"
                                  placeholder="Ulangi password baru"
                              />
                          </div>
                        </div>
                      </div>
                  </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold shadow-md mt-6">
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