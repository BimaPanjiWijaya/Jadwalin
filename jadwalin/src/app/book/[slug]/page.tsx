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

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        {business.logoUrl && (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {business.name}
              </h1>
              <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium mt-1 capitalize">
                {business.category}
              </span>
            </div>
          </div>
          {business.description && (
            <p className="text-sm text-gray-500 mt-3">{business.description}</p>
          )}
          {business.address && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              {business.address}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Pilih Tanggal</h2>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Pilih Waktu</h2>
            {slots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  Tidak ada slot tersedia untuk tanggal ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isFull = slot._count.bookings >= slot.maxCapacity;
                  const isBlocked = slot.status === "BLOCKED";
                  const isSelected = selectedSlot?.id === slot.id;
                  const unavailable = isFull || isBlocked;
                  return (
                    <button
                      key={slot.id}
                      disabled={unavailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-sm text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : unavailable
                            ? "bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100"
                            : "bg-white hover:border-blue-400 hover:text-blue-600 border-gray-200"
                      }`}
                    >
                      <div className="font-medium">
                        {formatTime(slot.startTime)}
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {slot.service.name}
                      </div>
                      {isFull && (
                        <div className="text-xs mt-0.5 text-red-400">Penuh</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">
              Ringkasan Booking
            </h2>
            {!selectedSlot ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Pilih tanggal dan waktu terlebih dahulu
              </p>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Layanan</span>
                    <span className="font-medium">
                      {selectedSlot.service.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waktu</span>
                    <span className="font-medium">
                      {formatTime(selectedSlot.startTime)} –{" "}
                      {formatTime(selectedSlot.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-medium">
                      {new Date(date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-500">Harga</span>
                    <span className="font-bold text-blue-600">
                      {formatPrice(selectedSlot.service.price)}
                    </span>
                  </div>
                </div>
                <textarea
                  placeholder="Catatan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                {success && <p className="text-green-600 text-xs">{success}</p>}
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Memproses..." : "Konfirmasi Booking"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
