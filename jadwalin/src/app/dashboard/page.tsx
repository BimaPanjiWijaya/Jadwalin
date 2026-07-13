import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/src/components/StatCard";
import BookingStatusBadge from "@/src/components/BookingStatusBadge";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") redirect("/login");

  const business = await prisma.business.findFirst({
    where: { ownerId: session.id },
  });

  if (!business) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Selamat datang!
          </h1>
          <p className="text-gray-500 mb-6">
            Kamu belum punya bisnis. Buat sekarang untuk mulai menerima booking.
          </p>
          <Link
            href="/dashboard/setup"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Buat Bisnis
          </Link>
        </div>
      </main>
    );
  }
}
