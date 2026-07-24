import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    businessId,
    serviceId,
    date,
    openTime,
    closeTime,
    intervalMinutes = 30,
  } = await req.json();

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const slotsToCreate = [];
  for (
    let start = openMinutes;
    start + intervalMinutes <= closeMinutes;
    start += intervalMinutes
  ) {
    const startH = Math.floor(start / 60);
    const startM = start % 60;
    const endH = Math.floor((start + intervalMinutes) / 60);
    const endM = (start + intervalMinutes) % 60;

    slotsToCreate.push({
      businessId,
      serviceId,
      slotDate: new Date(date),
      startTime: new Date(0, 0, 0, startH, startM),
      endTime: new Date(0, 0, 0, endH, endM),
      maxCapacity: 1,
    });
  }

  await prisma.slot.createMany({ data: slotsToCreate });

  return NextResponse.json({ created: slotsToCreate.length }, { status: 201 });
}
