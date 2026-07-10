"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: Service;
  _count: { bookings: number };
  maxCapacity: number;
};

type Business = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  services: Service[];
};

export default function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/businesses/${slug}`)
        .then((r) => r.json())
        .then(setBusiness);
    });
  }, [params]);

  useEffect(() => {
    if (!business) return;
    fetch(`/api/slots?businessId=${business.id}&data=${date}`)
      .then((r) => r.json())
      .then(setSlots);
    setSelectedSlot(null);
  }, [business, date]);

  async function handleBooking() {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot.id, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("Booking berhasil! Cek email kamu untuk konfirmasi");
      setTimeout(() => router.push("/my-bookings"), 2000);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat...</div>
      </div>
    );
  }

  const formatTime = (isoTime: string) =>
    new Date(isoTime).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (price: number) =>
    price > 0 ? `Rp ${price.toLocaleString("id-ID")}` : "Gratis";
}
