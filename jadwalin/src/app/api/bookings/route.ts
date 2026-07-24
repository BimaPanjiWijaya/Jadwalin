import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { sendBookingConfirmationEmail } from "@/src/lib/mailer";
import { sendBookingConfirmationTelegram } from "@/src/lib/telegram";

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `JDW-${code}`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");

  if (customerId) {
    if (customerId !== session.id) {
      return NextResponse.json({ error: "Forbiden" }, { status: 403 });
    }
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        slot: { include: { business: true, service: true } },
      },
      orderBy: { bookedAt: "desc" },
    });
    return NextResponse.json(bookings);
  }

  if (businessId && date) {
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.id },
    });
    if (!business)
      return NextResponse.json({ error: "Forbiden" }, { status: 403 });

    const slotDate = new Date(date);
    const nextDate = new Date(slotDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        slot: {
          businessId,
          slotDate: { gte: slotDate, lt: nextDate },
        },
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        slot: { include: { service: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    });
    return NextResponse.json(bookings);
  }
  return NextResponse.json(
    { error: "customerId atau businessId+date wajid diisi" },
    { status: 400 },
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId, notes } = await req.json();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { _count: { select: { bookings: true } } },
      });

      if (!slot) throw new Error("Slot tidak ditemukan");
      if (slot.status === "BLOCKED") throw new Error("Slot tidak tersedia");
      if (slot._count.bookings >= slot.maxCapacity)
        throw new Error("Slot sudah penuh");

      const existing = await tx.booking.findUnique({
        where: { slotId_customerId: { slotId, customerId: session.id } },
      });
      if (existing) throw new Error("Kamu sudah booking slot ini");

      const newBooking = await tx.booking.create({
        data: {
          slotId,
          customerId: session.id,
          notes,
          bookingCode: generateBookingCode(),
        },
        include: {
          slot: { include: { business: true, service: true } },
          customer: true,
        },
      });

      const totalBookings = slot._count.bookings + 1;
      if (totalBookings >= slot.maxCapacity) {
        await tx.slot.update({
          where: { id: slotId },
          data: { status: "FULL" },
        });
      }

      return newBooking;
    });

    const notifData = {
      customerName: booking.customer.name,
      businessName: booking.slot.business.name,
      serviceName: booking.slot.service.name,
      date: booking.slot.slotDate.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: booking.slot.startTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      bookingCode: `JDW-${booking.id.slice(0, 6).toUpperCase()}`,
    };

    sendBookingConfirmationEmail(booking.customer.email, notifData).catch(
      (err) => console.error("Email gagal:", err),
    );

    if (booking.customer.telegramChatId) {
      sendBookingConfirmationTelegram(
        booking.customer.telegramChatId,
        notifData,
      ).catch((err) => console.error("Telegram gagal:", err));
    }

    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        userId: session.id,
        channel: booking.customer.telegramChatId ? "ALL" : "EMAIL",
        type: "BOOKING_CONFIRMED",
        status: "QUEUED",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
