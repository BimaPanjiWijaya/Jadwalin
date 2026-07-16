import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Semua field wajib diisi" },
      { status: 400 },
    );
  }

  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist) {
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role === "BUSINESS_OWNER" ? "BUSINESS_OWNER" : "CUSTOMER",
    },
  });

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    { status: 201 },
  );
}
