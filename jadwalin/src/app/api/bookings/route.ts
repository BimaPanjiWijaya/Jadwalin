import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");

  if (customerId) {
    if (customerId !== session.id) {
      return NextResponse.json({ error: "Forbiden" }, { status: 403 });
    }
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        slot: { include: { business: true, service: true } },
      },
      orderBy: { bookedAt: "desc" },
    });
    return NextResponse.json(bookings);
  }

  if (businessId && date) {
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.id },
    });
    if (!business)
      return NextResponse.json({ error: "Forbiden" }, { status: 403 });

    const slotDate = new Date(date);
    const nextDate = new Date(slotDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        slot: {
          businessId,
          slotDate: { gte: slotDate, lt: nextDate },
        },
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        slot: { include: { service: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    });
    return NextResponse.json(bookings);
  }
  return NextResponse.json(
    { error: "customerId atau businessId+date wajid diisi" },
    { status: 400 },
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId, notes } = await req.json();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { _count: { select: { bookings: true } } },
      });

      if (!slot) throw new Error("Slot tidak ditemukan");
      if (slot.status === "BLOCKED") throw new Error("Slot tidak tersedia");
      if (slot._count.bookings >= slot.maxCapacity)
        throw new Error("Slot sudah penuh");

      const existing = await tx.booking.findUnique({
        where: { slotId_customerId: { slotId, customerId: session.id } },
      });
      if (existing) throw new Error("Kamu sudah booking slot ini");

      const newBooking = await tx.booking.create({
        data: { slotId, customerId: session.id, notes },
        include: {
          slot: { include: { business: true, service: true } },
          customer: true,
        },
      });

      const totalBookings = slot._count.bookings + 1;
      if (totalBookings >= slot.maxCapacity) {
        await tx.slot.update({
          where: { id: slotId },
          data: { status: "FULL" },
        });
      }

      return newBooking;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.messge }, { status: 400 });
  }
}
