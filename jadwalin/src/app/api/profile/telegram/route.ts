import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { telegramChatId } = await req.json();

  if (!telegramChatId) {
    return NextResponse.json(
      { error: "telegramChatId wajib diisi" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: { telegramChatId },
    select: { id: true, name: true, telegramChatId: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.id },
    data: { telegramChatId: null },
  });
  return NextResponse.json({ message: "Telegram berhasil diputus" });
}
