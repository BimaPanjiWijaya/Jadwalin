import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { error } from "console";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const business = await prisma.business.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    include: {
      services: { where: { isActive: true } },
      owner: { select: { name: true, email: true } },
    },
  });
  if (!business) {
    return NextResponse.json(
      { error: "Bisnis tidak ditemukan" },
      { status: 404 },
    );
  }
  return NextResponse.json(business);
}
