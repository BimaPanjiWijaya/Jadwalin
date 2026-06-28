import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout Berhasil" });
  response.cookies.set("token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
