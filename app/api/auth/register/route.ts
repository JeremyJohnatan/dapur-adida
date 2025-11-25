import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

    // 2. Cek apakah username sudah dipakai orang lain?
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username sudah digunakan, silakan pilih yang lain." },
        { status: 400 }
      );
    }

    // 3. Enkripsi Password (Hashing)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Simpan User Baru ke Database
    const newUser = await prisma.user.create({
      data: {
        fullName,
        username, // Simpan username
        password: hashedPassword,
        phoneNumber: phone,
        role: "CUSTOMER", // Default jadi customer
      },
    });

    // 5. Sukses (Buang password dari data yang dikembalikan biar aman)
    const { password: newUserPassword, ...rest } = newUser;

    return NextResponse.json(
      { user: rest, message: "Pendaftaran berhasil!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat mendaftar." },
      { status: 500 }
    );
  }
}