import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json(
      { error: "businessId wajib diisi" },
      { status: 400 },
    );
  }

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbiden" }, { status: 403 });
  }
  const { businessId, name, description, durationMinutes, price } =
    await req.json();

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business)
    return NextResponse.json({ error: "Forbiden" }, { status: 403 });

  const service = await prisma.service.create({
    data: { businessId, name, description, durationMinutes, price: price || 0 },
  });
  return NextResponse.json(service, { status: 201 });
}
