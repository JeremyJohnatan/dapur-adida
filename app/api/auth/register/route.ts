import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Ambil username, bukan email
    const { fullName, username, password, phone } = body;

    // 1. Validasi Input
    if (!fullName || !username || !password) {
      return NextResponse.json(
        { message: "Nama, Username, dan Password wajib diisi!" },
        { status: 400 }
      );
    }

    // 2. Username validation - minimal 3 karakter
    if (username.length < 3) {
      return NextResponse.json(
        { message: "Username minimal 3 karakter" },
        { status: 400 }
      );
    }

    // 3. Username hanya huruf, angka, dan underscore
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { message: "Username hanya boleh huruf, angka, dan underscore" },
        { status: 400 }
      );
    }

    // 4. Cek apakah username sudah dipakai - case insensitive
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username sudah digunakan, silakan pilih yang lain." },
        { status: 409 }
      );
    }

    // 5. Enkripsi Password (Hashing)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Simpan User Baru ke Database
    const newUser = await prisma.user.create({
      data: {
        fullName,
        username: username.toLowerCase(),
        password: hashedPassword,
        phoneNumber: phone,
        role: "CUSTOMER",
      },
    });

    // 7. Sukses (Buang password dari data yang dikembalikan biar aman)
    const { password: newUserPassword, ...rest } = newUser;

    return NextResponse.json(
      { user: rest, message: "Pendaftaran berhasil!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);

    // Handle Prisma unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Username sudah terdaftar. Silakan gunakan username lain." },
        { status: 409 }
      );
    }

    // Handle other database errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Username sudah terdaftar. Silakan gunakan username lain." },
        { status: 409 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { message: "Gagal mendaftar. Coba lagi nanti." },
      { status: 500 }
    );
  }
}