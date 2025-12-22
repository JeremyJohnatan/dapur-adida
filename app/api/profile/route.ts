import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: Ambil Data Profil User (TETAP SAMA)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        fullName: true,
        username: true,
        email: true,
        phoneNumber: true,
        address: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// PATCH: Update Data Profil (DIPERBARUI)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    // Tambahkan oldPassword di sini
    const { fullName, username, password, oldPassword, address, phoneNumber } = body;

    // --- 1. Validasi Unik Username ---
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Username sudah digunakan, silakan pilih yang lain." },
          { status: 400 }
        );
      }
    }

    // --- 2. Siapkan Data Update ---
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (address !== undefined) updateData.address = address;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    // --- 3. Logika Ganti Password (DENGAN CEK PASSWORD LAMA) ---
    if (password) {
      // a. Pastikan oldPassword dikirim
      if (!oldPassword) {
        return NextResponse.json(
          { message: "Untuk mengganti password, harap masukkan password lama." },
          { status: 400 }
        );
      }

      // b. Ambil password hash user saat ini dari DB
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!currentUser?.password) {
         return NextResponse.json({ message: "User tidak valid." }, { status: 404 });
      }

      // c. Cek kecocokan password lama
      const isPasswordValid = await bcrypt.compare(oldPassword, currentUser.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Password lama salah! Tidak dapat mengganti password." },
          { status: 400 }
        );
      }

      // d. Jika cocok, hash password BARU
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // --- 4. Update ke Database ---
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ message: "Gagal update profil" }, { status: 500 });
  }
}