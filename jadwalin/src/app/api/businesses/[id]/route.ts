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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { getSession } = await import("@/src/lib/auth");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findUnique({
    where: { id },
  });
  if (!business || business.ownerId !== session.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      {
        status: 403,
      },
    );
  }

  const data = await req.json();
  const updated = await prisma.business.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}
