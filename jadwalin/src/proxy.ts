import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "./lib/jwt";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;
  const session = token ? verifyToken(token) : null;
}
