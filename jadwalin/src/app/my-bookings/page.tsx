import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingStatusBadge from "@/src/components/BookingStatusBadge";

export default async function MyBookingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.id },
    include: { slot: { include: { business: true, service: true } } },
    orderBy: { bookedAt: "desc" },
  });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Booking</h1>

      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400 mb-4">Kamu belum punya booking.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Cari Layanan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {booking.slot.business.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {booking.slot.service.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(booking.slot.slotDate)} ·{" "}
                    {formatTime(booking.slot.startTime)} –{" "}
                    {formatTime(booking.slot.endTime)}
                  </p>
                  {booking.bookingCode && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      #{booking.bookingCode}
                    </p>
                  )}
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
