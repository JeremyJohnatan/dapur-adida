import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route"; // Adjust path import

const prisma = new PrismaClient();

// PATCH: Edit Menu
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const updatedMenu = await prisma.menu.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price ? Number(body.price) : undefined,
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable,
      },
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    return NextResponse.json({ message: "Gagal update menu" }, { status: 500 });
  }
}

// DELETE: Hapus Menu
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    await prisma.menu.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Menu dihapus" });
  } catch (error) {
    return NextResponse.json({ message: "Gagal hapus menu" }, { status: 500 });
  }
}