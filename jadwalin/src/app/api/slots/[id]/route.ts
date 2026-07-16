import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { error } from "console";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbiden" }, { status: 403 });
  }

  const { status } = await req.json();
  const slot = await prisma.slot.findFirst({
    where: { id, business: { ownerId: session.id } },
  });
  if (!slot)
    return NextResponse.json(
      { error: "Slot tidak ditemukan" },
      { status: 404 },
    );

  const updated = await prisma.slot.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbiden" }, { status: 403 });
  }

  const slot = await prisma.slot.findFirst({
    where: { id, business: { ownerId: session.id } },
    include: { _count: { select: { bookings: true } } },
  });
  if (!slot)
    return NextResponse.json(
      { error: "Slot tidak ditemukan" },
      { status: 404 },
    );
  if (slot._count.bookings > 0) {
    return NextResponse.json(
      { error: "Tidak bisa hapus sloy yang sudah ada booking" },
      { status: 400 },
    );
  }

  await prisma.slot.delete({ where: { id } });
  return NextResponse.json({ messahe: "Slot berhasil dihapus" });
}
