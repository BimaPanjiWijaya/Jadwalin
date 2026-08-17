import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const mine = searchParams.get("mine");

  if (mine) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const myBusinesses = await prisma.business.findMany({
      where: { ownerId: session.id },
      include: {
        services: { where: { isActive: true } },
        _count: { select: { slots: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(myBusinesses);
  }

  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    include: {
      services: { where: { isActive: true } },
      _count: { select: { slots: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(businesses);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, slug, category, description, address, phone } =
    await req.json();

  if (!name || !slug || !category) {
    return NextResponse.json(
      { error: "name, slug, dan category wajib diisi" },
      { status: 400 },
    );
  }
  const exists = await prisma.business.findUnique({
    where: { slug },
  });
  if (exists) {
    return NextResponse.json({ error: "slug sudah dipakai" }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: {
      ownerId: session.id,
      name,
      slug,
      category,
      description,
      address,
      phone,
    },
  });
  return NextResponse.json(business, { status: 201 });
}
