import { cookies } from "next/headers";
import { verifyToken, JwtPayload } from "./jwt";

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  return verifyToken(token);
}
