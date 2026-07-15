import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");

  if (!businessId || !date) {
    return NextResponse.json(
      { error: "businessId dan date wajib diisi" },
      { status: 400 },
    );
  }

  const slotDate = new Date(date);
  const nextDate = new Date(slotDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const slots = await prisma.slot.findMany({
    where: {
      businessId,
      slotDate: { gte: slotDate, lt: nextDate },
      status: { not: "BLOCKED" },
    },
    include: {
      service: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json(
      { error: "Forbidden" },
      {
        status: 403,
      },
    );
  }

  const { businessId, serviceId, slotDate, startTime, endTime, maxCapaciity } =
    await req.json();

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });

  if (!business)
    return NextResponse.json(
      { error: "Forbiden" },
      {
        status: 403,
      },
    );

  const slot = await prisma.slot.create({
    data: {
      businessId,
      serviceId,
      slotDate: new Date(slotDate),
      startTime: new Date(`1970-01-01T${startTime}:00`),
      endTime: new Date(`1970-01-01T${endTime}:00`),
      maxCapacity: maxCapaciity || 1,
    },
  });
  return NextResponse.json(slot, { status: 201 });
}
