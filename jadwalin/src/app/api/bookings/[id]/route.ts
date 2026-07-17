import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {}
