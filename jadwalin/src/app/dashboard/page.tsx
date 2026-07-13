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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, totalSlots, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        slot: {
          businessId: business.id,
          slotDate: { gte: today, lt: tomorrow },
        },
        status: { not: "CANCELLED" },
      },
      include: {
        customer: { select: { name: true, email: true } },
        slot: { include: { service: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    }),
    prisma.slot.count({ where: { businessId: business.id } }),
    prisma.booking.count({
      where: {
        slot: { businessId: business.id },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium capitalize">
            {business.category}
          </span>
        </div>
        <Link
          href="/dashboard/slots"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Kelola Slot
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Booking Hari Ini" value={todayBookings.length} />
        <StatCard
          label="Total Slot"
          value={totalSlots}
          color="text-purple-600"
        />
        <StatCard
          label="Total Booking"
          value={totalBookings}
          color="text-green-600"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Antrian Hari Ini</h2>
        </div>
        {todayBookings.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            Tidak ada booking hari ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {booking.customer.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.slot.service.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(booking.slot.startTime)} –{" "}
                    {formatTime(booking.slot.endTime)}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
