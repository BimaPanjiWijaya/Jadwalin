import Link from "next/link";
import { getSession } from "@/src/lib/auth";
import LogoutButton from "./LogoutButton";
import NavbarMobileMenu from "./NavbarMobileMenu";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-blue-600 font-bold text-xl tracking-tight"
        >
          Jadwalin
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Beranda
          </Link>
          {session?.role === "CUSTOMER" && (
            <Link
              href="/my-bookings"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Booking Saya
            </Link>
          )}
          {session?.role === "BUSINESS_OWNER" && (
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
          )}
          {session ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Profil
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Daftar
              </Link>
            </div>
          )}
        </nav>

        <NavbarMobileMenu session={session} />
      </div>
    </header>
  );
}
