import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status } = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: { include: { business: true } } },
  });

  if (!booking)
    return NextResponse.json(
      { error: "Booking tidak ditemukan" },
      { status: 404 },
    );

  if (session.role === "CUSTOMER") {
    if (booking.customerId !== session.id || status !== "CANCELLED") {
      return NextResponse.json({ error: "Forbiden" }, { status: 403 });
    }
  }

  if (session.role === "BUSINESS_OWNER") {
    if (booking.slot.business.ownerId !== session.id) {
      return NextResponse.json({ error: "Forbiden" }, { status: 403 });
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  if (status === "CANCELLED") {
    await prisma.slot.update({
      where: { id: booking.slotId },
      data: { status: "AVAILABLE" },
    });
  }
  return NextResponse.json(updated);
}
