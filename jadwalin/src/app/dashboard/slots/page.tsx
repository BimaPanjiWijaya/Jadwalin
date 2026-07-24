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
  service: { id: string; name: string }[];
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
        serviceId: fd.get("servideId"),
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
}
