"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Session = { id: string; role: string; email: string } | null;

export default function NavbarMobileMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.push("/login");
    router.refresh();
    setOpen(false);
  }
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-600 hover:text-blue-600"
        aria-label="Menu"
      >
        {open ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg px-6 py-4 flex flex-col gap-4 z-50">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-sm text-gray-700 hover:text-blue-600"
          >
            Beranda
          </Link>
          {session?.role === "CUSTOMER" && (
            <Link
              href="/my-bookings"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-700 hover:text-blue-600"
            >
              Booking Saya
            </Link>
          )}
          {session?.role === "BUSINESS_OWNER" && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-700 hover:text-blue-600"
            >
              Dashboard
            </Link>
          )}
          {session ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-700 hover:text-blue-600"
              >
                Profil
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 text-left"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-700"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="text-sm text-blue-600 font-medium"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
