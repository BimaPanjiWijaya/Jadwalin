import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = await prisma.service.findFirst({
    where: { id, business: { ownerId: session.id } },
  });
  if (!service) {
    return NextResponse.json(
      { error: "Layanan tidak ditemukan" },
      { status: 404 },
    );
  }

  const { name, description, durationMinutes, price, isActive } =
    await req.json();

  if (name !== undefined && !name.trim()) {
    return NextResponse.json(
      { error: "Nama layanan wajib diisi" },
      { status: 400 },
    );
  }

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined
        ? { description: description || null }
        : {}),
      ...(durationMinutes !== undefined
        ? { durationMinutes: Number(durationMinutes) }
        : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });
  return NextResponse.json(updated);
}
