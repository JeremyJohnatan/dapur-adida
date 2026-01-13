import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { address: true },
    });

    return NextResponse.json({ address: addresses?.address || null });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil alamat" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { address } = body;

    if (!address || address.trim() === "") {
      return NextResponse.json({ message: "Alamat tidak boleh kosong" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { address },
      select: { id: true, address: true },
    });

    return NextResponse.json({
      message: "Alamat berhasil disimpan",
      address: updatedUser.address,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan alamat" }, { status: 500 });
  }
}
