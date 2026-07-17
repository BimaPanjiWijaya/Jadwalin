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

export async function POST() {}
