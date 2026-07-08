import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { error } from "console";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

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
  const { getSession } = await import("@/src/lib/auth");
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, slug, category, description, address, phone } =
    await req.json();
}
