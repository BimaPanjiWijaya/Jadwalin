const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Telegram error:", err);
    throw new Error(`Telegram gagal: ${err.description}`);
  }
}

export async function sendBookingConfirmationTelegram(
  chatId: string,
  data: {
    customerName: string;
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    bookingCode: string;
  },
) {
  const text = `
    ✅ *Booking Dikonfirmasi!*

Halo ${data.customerName}, booking kamu sudah berhasil.

📍 *${data.businessName}*
💈 ${data.serviceName}
📅 ${data.date}
🕐 ${data.time}
🔖 Kode: \`${data.bookingCode}\`

Sampai jumpa! 👋
  `.trim();

  await sendTelegramMessage(chatId, text);
}

export async function sendReminderTelegram(
  chatId: string,
  data: {
    customerName: string;
    businessName: string;
    date: string;
    time: string;
  },
) {
  const text = `
⏰ *Reminder Booking Besok!*

Halo ${data.customerName}, jangan lupa booking kamu besok ya!

📍 *${data.businessName}*
📅 ${data.date}
🕐 ${data.time}

Sampai jumpa! 👋
  `.trim();

  await sendTelegramMessage(chatId, text);
}
