"use client";

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // 1. Coba Login
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Username atau Password salah!");
      setIsLoading(false);
    } else {
      // 2. Login Sukses! Cek Role
      const session = await getSession();
      
      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-slate-900">
        <CardHeader className="space-y-1 text-center">
          <div className='flex justify-center mb-2'>
            <ChefHat className="h-10 w-10 text-slate-900" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Masuk ke Dapur Adida</CardTitle>
          <CardDescription>
            Masukkan username dan kata sandi Anda.
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
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="Username Anda" 
                required 
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Kata Sandi</Label>
              </div>
              <Input id="password" name="password" type="password" placeholder="Kata Sandi Anda" required disabled={isLoading} />
            </div>
          </CardContent>

          {/* PERBAIKAN: Ditambahkan 'pt-6' agar ada jarak dengan input password */}
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Masuk...</>
              ) : (
                "Masuk"
              )}
            </Button>
            <p className="text-sm text-center text-slate-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-slate-900 hover:underline">
                Daftar di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}