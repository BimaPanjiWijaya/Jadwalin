import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/jwt";

export async function POST(req: Request) {
  const { credential } = await req.json();

  if (!credential) {
    return NextResponse.json(
      { error: "Token Google tidak ditemukan" },
      { status: 400 },
    );
  }

  const verifyRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
  );

  if (!verifyRes.ok) {
    return NextResponse.json(
      { error: "Token Google tidak valid" },
      { status: 401 },
    );
  }

  const payload = await verifyRes.json();

  if (payload.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Token Google tidak valid" },
      { status: 401 },
    );
  }
  if (payload.email_verified !== "true") {
    return NextResponse.json(
      { error: "Email Google belum terverifikasi" },
      { status: 401 },
    );
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
        role: "CUSTOMER",
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        avatarUrl: payload.picture ?? user.avatarUrl,
      },
    });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isNewUser,
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
