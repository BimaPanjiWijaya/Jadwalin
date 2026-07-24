import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ erro: "Forbiden" }, { status: 403 });
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
    return NextResponse.json({ error: "Forbiden" }, { status: 403 });
}
