import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";


// GET: Ambil Data Profil User
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

// PATCH: Update Data Profil
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { fullName, phoneNumber, address } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        phoneNumber,
        address,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ message: "Gagal update profil" }, { status: 500 });
  }
}