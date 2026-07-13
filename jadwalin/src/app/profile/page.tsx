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
}
