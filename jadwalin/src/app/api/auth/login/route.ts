import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/src/lib/jwt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan Password wajib diisi" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Email atau Password salah" },
      { status: 401 },
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Email atau Password salah" },
      { status: 401 },
    );
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
