import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { menuId, rating, comment } = body;

    if (!menuId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Data tidak valid" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        menuId,
        rating,
        comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menambah review" }, { status: 500 });
  }
}