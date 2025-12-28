"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// 1. Import Image dari next/image
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// 2. Hapus ChefHat dari import lucide-react
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State untuk visibilitas password (terpisah antara password utama & konfirmasi)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullname");
    const username = formData.get("username");
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const phone = formData.get("phone");

    // 1. VALIDASI MANUAL: Cek apakah password sama
    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok! Silakan periksa kembali.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal mendaftar");
        setIsLoading(false);
        return;
      }

      alert("Pendaftaran Berhasil! Silakan Login dengan Username baru Anda.");
      router.push("/login"); 
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-slate-900">
        <CardHeader className="space-y-1 text-center">
          <div className='flex justify-center mb-4'> {/* Margin bottom disesuaikan */}
            {/* 3. Ganti ChefHat dengan Image Logo */}
            <Image
              src="/logo_dapuradida.jpeg"
              alt="Logo Dapur Adida"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Daftar Akun</CardTitle>
          <CardDescription>
            Buat username unik untuk mulai memesan.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
                {error}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="fullname">Nama Lengkap</Label>
              <Input id="fullname" name="fullname" type="text" placeholder="Nama Lengkap" required disabled={isLoading} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="cth: adidaputra (tanpa spasi)" 
                required 
                disabled={isLoading}
              />
            </div>

            {/* INPUT PASSWORD UTAMA */}
            <div className="grid gap-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  disabled={isLoading} 
                  placeholder="Minimal 6 karakter"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* INPUT KONFIRMASI PASSWORD */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  disabled={isLoading} 
                  placeholder="Ulangi kata sandi"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input id="phone" name="phone" type="tel" placeholder="08xxxxxxxxxx" disabled={isLoading} />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftar...</>
              ) : (
                "Daftar Sekarang"
              )}
            </Button>
            <p className="text-sm text-center text-slate-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}