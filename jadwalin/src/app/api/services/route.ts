import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const includeInactive = searchParams.get("includeInactive");

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId wajib diisi" },
      { status: 400 },
    );
  }

  let showInactive = false;
  if (includeInactive) {
    const session = await getSession();
    if (session) {
      const business = await prisma.business.findFirst({
        where: { id: businessId, ownerId: session.id },
      });
      showInactive = !business;
    }
  }
  const services = await prisma.service.findMany({
    where: { businessId, ...(showInactive ? {} : { isActive: true }) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessId, name, description, durationMinutes, price } =
    await req.json();

  if (!name?.trim() || !durationMinutes || Number(durationMinutes) <= 0) {
    return NextResponse.json(
      { error: "Nama layanan dan durasi (menit) wajib diisi dengan benar" },
      { status: 400 },
    );
  }

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = await prisma.service.create({
    data: {
      businessId,
      name: name.trim(),
      description: description || null,
      durationMinutes: Number(durationMinutes),
      price: price ? Number(price) : 0,
    },
  });
  return NextResponse.json(service, { status: 201 });
}
