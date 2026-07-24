import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendReminderEmail } from "@/src/lib/mailer";
import { sendReminderTelegram } from "@/src/lib/telegram";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      remindedAt: null,
      status: "CONFIRMED",
      slot: { slotDate: { gte: tomorrow, lt: nextDay } },
    },
    include: {
      customer: true,
      slot: { include: { business: true } },
    },
  });
  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const notifData = {
        customerName: booking.customer.name,
        businessName: booking.slot.business.name,
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
      };

      await sendReminderEmail(booking.customer.email, notifData);

      if (booking.customer.telegramChatId) {
        await sendReminderTelegram(booking.customer.telegramChatId, notifData);
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: { remindedAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`Gagal kirim reminder booking ${booking.id}:`, err);
      failed++;
    }
  }
  return NextResponse.json({ sent, failed, total: bookings.length });
}
