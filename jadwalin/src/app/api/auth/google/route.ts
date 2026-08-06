import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/jwt";

export async function POST(req: Request) {
  const { credential } = await req.json();

  if (!credential) {
    return NextResponse.json(
      { error: "Token Gooogle tidak ditemukan" },
      { status: 400 },
    );
  }
}
