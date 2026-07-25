"use client";

import React, { useState } from "react";
import BookingStatusBadge from "@/src/components/BookingStatusBadge";

type Booking = {
  id: string;
  status: string;
  notes?: string | null;
  bookedAt: string;
  bookingCode?: string | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    telegramChatId?: string | null;
  };
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    service: { name: string; price?: number };
  };
};

export default function BookingsTable({
  initialBookings,
  businessId,
  initialDate,
}: {
  initialBookings: Booking[];
  businessId: string;
  initialDate: string;
}) {
  // formatTime didefinisikan di sini, bukan diterima lewat props, karena
  // function tidak bisa dikirim dari Server Component ke Client Component.
  const formatTime = (d: string | Date) =>
    new Date(d).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const [bookings, setBookings] = useState<Booking[]>(initialBookings || []);
  const [date, setDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchBookings(newDate: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/bookings?businessId=${businessId}&date=${newDate}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Gagal memuat booking");
        setBookings([]);
        return;
      }
      setBookings(json);
    } catch {
      setError("Gagal terhubung ke server");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: "CONFIRMED" | "CANCELLED") {
    setMutating(id);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Gagal mengupdate booking");
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: json.status } : b)),
      );
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setMutating(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Booking pada {date}</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const val = e.target.value;
              setDate(val);
              fetchBookings(val);
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && <div className="p-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="p-6 text-center text-gray-400">Memuat...</div>
      ) : bookings.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          Tidak ada booking pada tanggal ini.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{b.customer.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {b.slot.service.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(b.slot.startTime)} – {formatTime(b.slot.endTime)}{" "}
                  • {b.customer.email}
                </p>
                {b.notes && (
                  <p className="text-xs text-gray-500 mt-1">
                    Catatan: {b.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <BookingStatusBadge status={b.status} />
                <div className="flex items-center gap-2">
                  {b.status !== "CONFIRMED" && (
                    <button
                      onClick={() => updateStatus(b.id, "CONFIRMED")}
                      disabled={mutating === b.id}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {mutating === b.id ? "..." : "Konfirmasi"}
                    </button>
                  )}
                  {b.status !== "CANCELLED" && (
                    <button
                      onClick={() => updateStatus(b.id, "CANCELLED")}
                      disabled={mutating === b.id}
                      className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-xl text-sm hover:bg-red-100 disabled:opacity-50"
                    >
                      {mutating === b.id ? "..." : "Batal"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
