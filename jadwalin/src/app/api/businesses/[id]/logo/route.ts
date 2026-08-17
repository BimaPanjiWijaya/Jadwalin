import { NextResponse } from "next/server";
import { uploadImage } from "@/src/lib/cloudinary";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findUnique({ where: { id } });
  if (!business || business.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;
  if (!file)
    return NextResponse.json({ error: "File Wajib diupload" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Hanya file gambar yang diizinkan" },
      { status: 400 },
    );
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Ukuran file maksimal 2MB" },
      { status: 400 },
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = await uploadImage(buffer, "jadwalin/logos");
  await prisma.business.update({ where: { id }, data: { logoUrl } });

  return NextResponse.json({ logoUrl });
}
