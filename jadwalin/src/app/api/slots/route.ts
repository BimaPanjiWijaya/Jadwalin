import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { error } from "console";

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
