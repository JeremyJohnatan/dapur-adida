import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params;

    const reviews = await prisma.review.findMany({
      where: { menuId },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({ reviews, averageRating });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil reviews" }, { status: 500 });
  }
}