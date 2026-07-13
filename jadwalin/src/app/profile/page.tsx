"use client";

import React, { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  telegramChatId: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser);
  }, []);

  async function saveTelegram(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setMessage("Telegram berhasil dihubungkan!");
        setUser((prev) => (prev ? { ...prev, telegramChatId: chatId } : prev));
      } else {
        setIsSuccess(false);
        setMessage(data.error);
      }
    } catch {
      setMessage("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  async function disconnectTelegram() {
    setLoading(true);
    await fetch("/api/profile/telegram", { method: "DELETE" });
    setUser((prev) => (prev ? { ...prev, telegramChatId: null } : prev));
    setChatId("");
    setIsSuccess(false);
    setMessage("Telegram berhasil diputus");
    setLoading(false);
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-pulse
            text-gray-400"
        >
          Memuat...
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil</h1>

      {/* Info akun */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium capitalize">
              {user.role === "BUSINESS_OWNER" ? "Business Owner" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-blue-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
          </svg>
          <h2 className="font-semibold text-gray-900">Notifikasi Telegram</h2>
        </div>

        {user.telegramChatId ? (
          <div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm text-green-700 font-medium">
                Telegram terhubung
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Chat ID: <span className="font-mono">{user.telegramChatId}</span>
            </p>
            <button
              onClick={disconnectTelegram}
              disabled={loading}
              className="text-sm text-red-500 hover:text-red-600 underline"
            >
              Putus koneksi
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-gray-600 space-y-1">
              <p>
                1. Buka{" "}
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium underline"
                >
                  @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
                </a>{" "}
                dan ketik <span className="font-mono">/start</span>
              </p>
              <p>2. Copy Chat ID yang dikirim bot</p>
              <p>3. Paste di bawah ini dan klik Simpan</p>
            </div>
            <form onSubmit={saveTelegram} className="flex gap-2">
              <input
                type="text"
                placeholder="Chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !chatId}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Simpan
              </button>
            </form>
          </div>
        )}

        {message && (
          <p
            className={`text-sm mt-3 ${isSuccess ? "text-green-600" : "text-red-500"}`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
