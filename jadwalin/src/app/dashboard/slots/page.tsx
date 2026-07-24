"use client";

import React, { useState, useEffect } from "react";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: { id: string; name: string };
  _count: { bookings: number };
  maxCapacity: number;
};

type Business = {
  id: string;
  name: string;
  services: { id: string; name: string }[];
};

export default function DashboardSlotsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((data: Business[]) => {
        if (data.length > 0) setBusiness(data[0]);
      });
  }, []);

  useEffect(() => {
    if (!business) return;
    fetchSlots();
  }, [business, date]);

  async function fetchSlots() {
    if (!business) return;
    const res = await fetch(
      `/api/slots?businessId=${business.id}&date=${date}`,
    );
    const data = await res.json();
    setSlots(data);
  }

  async function toggleBlock(slot: Slot) {
    const newStatus = slot.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
    await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchSlots();
  }

  async function handleGenerate(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!business) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/slots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        serviceId: fd.get("serviceId"),
        date,
        openTime: fd.get("openTime"),
        closeTime: fd.get("closeTime"),
        intervalMinutes: Number(fd.get("interval")),
      }),
    });
    setLoading(false);
    fetchSlots();
  }

  const formatTime = (isoTime: string) =>
    new Date(isoTime).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Kelola Slot</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <form onSubmit={handleGenerate} className="border rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Generate Slot Otomatis</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm">Layanan</label>
            <select
              name="serviceId"
              className="w-full border rounded px-2 py-1.5 mt-0.5 text-sm"
              required
            >
              {business?.services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Interval (menit)</label>
            <input
              name="interval"
              type="number"
              defaultValue="30"
              min="15"
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>
          <div>
            <label className="text-sm">Jam Buka</label>
            <input
              name="openTime"
              type="time"
              defaultValue="09:00"
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>
          <div>
            <label className="text-sm">Jam Tutup</label>
            <input
              name="closeTime"
              type="time"
              defaultValue="17:00"
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm"
        >
          {loading ? "Membuat..." : "Generate Slot"}
        </button>
      </form>

      <h2 className="font-semibold mb-3">Slot pada {date}</h2>
      {slots.length === 0 ? (
        <p className="text-gray-400">Belum ada slot untuk tanggal ini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`border rounded-lg p-3 ${
                slot.status === "BLOCKED" ? "bg-gray-100 opacity-60" : ""
              }`}
            >
              <p className="font-medium text-sm">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </p>
              <p className="text-xs text-gray-500">{slot.service.name}</p>
              <p className="text-xs text-gray-400 mb-2">
                {slot._count.bookings}/{slot.maxCapacity} booking
              </p>
              <button
                onClick={() => toggleBlock(slot)}
                className={`text-xs px-2 py-1 rounded ${
                  slot.status === "BLOCKED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {slot.status === "BLOCKED" ? "Unblock" : "Block"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
