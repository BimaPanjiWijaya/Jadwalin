import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { signToken } from "@/src/lib/jwt";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum Login" }, { status: 401 });
  }

  const { role } = await req.json();
  if (role !== "CUSTOMER" && role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { role },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  const response = NextResponse.json({ id: user.id, role: user.role });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
