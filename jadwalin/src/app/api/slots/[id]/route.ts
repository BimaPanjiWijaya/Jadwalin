import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { error } from "console";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbiden" }, { status: 403 });
  }

  const { status } = await req.json();
  const slot = await prisma.slot.findFirst({
    where: { id, business: { ownerId: session.id } },
  });
  if (!slot)
    return NextResponse.json(
      { error: "Slot tidak ditemukan" },
      { status: 404 },
    );

  const updated = await prisma.slot.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(updated);
}
