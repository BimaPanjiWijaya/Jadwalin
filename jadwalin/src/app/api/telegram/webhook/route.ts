import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat.id.toString();
  const text = message.text || "";

  if (text.startsWith("/start")) {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Halo! 👋 Selamat datang di Jadwalin Bot.\n\nChat ID kamu adalah:\n\`${chatId}\`\n\nCopy angka di atas dan paste di halaman profil Jadwalin kamu untuk mengaktifkan notifikasi Telegram.`,
          parse_mode: "Markdown",
        }),
      },
    );
  }
  return NextResponse.json({ ok: true });
}
