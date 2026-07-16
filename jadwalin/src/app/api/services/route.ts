import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = await new URL(req.url);
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
