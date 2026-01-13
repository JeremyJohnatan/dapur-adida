import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, message: "Username tidak valid" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { available: false, message: "Username sudah digunakan" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { available: true, message: "Username tersedia" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { available: false, message: "Error checking username" },
      { status: 500 }
    );
  }
}
