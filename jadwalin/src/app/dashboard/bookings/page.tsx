import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const BookingsTable = dynamic(() => import("./BookingsTable"));

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
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
            Belum ada bisnis
          </h1>
          <p className="text-gray-500 mb-6">
            Buat bisnis untuk mulai menerima booking.
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

  // searchParams sekarang Promise, wajib di-await
  const params = await searchParams;
  const dateParam = params?.date ?? new Date().toISOString().split("T")[0];

  const slotDate = new Date(dateParam);
  slotDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(slotDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      slot: {
        businessId: business.id,
        slotDate: { gte: slotDate, lt: nextDate },
      },
    },
    include: {
      customer: {
        select: { name: true, email: true, phone: true, telegramChatId: true },
      },
      slot: { include: { service: true } },
    },
    orderBy: { slot: { startTime: "asc" } },
  });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Serialize Date & Decimal ke string/number karena BookingsTable
  // (client component) mengharapkan tipe primitif.
  const serializedBookings = bookings.map((b) => ({
    ...b,
    bookedAt: b.bookedAt.toISOString(),
    slot: {
      ...b.slot,
      startTime: b.slot.startTime.toISOString(),
      endTime: b.slot.endTime.toISOString(),
      service: {
        ...b.slot.service,
        price: b.slot.service.price ? Number(b.slot.service.price) : undefined,
      },
    },
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daftar Booking — {business.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{business.category}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
        >
          Kembali ke Overview
        </Link>
      </div>

      <BookingsTable
        initialBookings={serializedBookings}
        businessId={business.id}
        initialDate={dateParam}
        formatTime={(d) =>
          typeof d === "string" ? formatTime(new Date(d)) : formatTime(d)
        }
      />
    </main>
  );
}
