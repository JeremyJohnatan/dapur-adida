"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullname");
    const username = formData.get("username"); // Ambil username
    const password = formData.get("password");
    const phone = formData.get("phone");

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
          <div className='flex justify-center mb-2'>
            <ChefHat className="h-10 w-10 text-slate-900" />
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
            
            {/* INPUT USERNAME (Pengganti Email) */}
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

            <div className="grid gap-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input id="phone" name="phone" type="tel" placeholder="08xxxxxxxxxx" disabled={isLoading} />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Daftar Sekarang"}
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