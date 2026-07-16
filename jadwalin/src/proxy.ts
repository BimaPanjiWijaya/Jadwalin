import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "./lib/jwt";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("auth_token")?.value;
  const session = token ? verifyToken(token) : null;

  const protectedRoutes = ["/my-bookings", "/book", "/dashboard"];
  const needsAuth = protectedRoutes.some((r) => pathname.startsWith(r));

  if (needsAuth && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/dashboard") && session?.role !== "BUSINESS_OWNER") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
