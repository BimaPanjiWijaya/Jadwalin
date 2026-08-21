"use client";

import React, { useState, useEffect } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

type Business = { id: string; name: string };

export default function DashboardServicesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: "30",
    price: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/businesses?mine=1");
        const data: Business[] = await res.json();
        if (data.length > 0) setBusiness(data[0]);
      } catch {
        setError("Gagal memuat data bisnis");
      }
    })();
  }, []);

  useEffect(() => {
    if (!business) return;
    fetchServices();
  }, [business]);

  async function fetchServices() {
    if (!business) return;
    try {
      const res = await fetch(
        `/api/services?businessId=${business.id}&includeInactive=1`,
      );
      const data = await res.json();
      setServices(data);
    } catch {
      setError("Gagal memuat layanan");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!business) return;

    if (!form.name.trim() || Number(form.durationMinutes) <= 0) {
      setError("Nama layanan dan durasi wajib diisi dengan benar");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: form.name,
          description: form.description,
          durationMinutes: Number(form.durationMinutes),
          price: Number(form.price) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Gagal menambah layanan");
        return;
      }
      setForm({ name: "", description: "", durationMinutes: "30", price: "0" });
      fetchServices();
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(service: Service) {
    setError("");
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal mengubah status layanan");
        return;
      }
      fetchServices();
    } catch {
      setError("Gagal terhubung ke server");
    }
  }

  const formatPrice = (price: number) =>
    price > 0 ? `Rp ${price.toLocaleString("id-ID")}` : "Gratis";

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kelola Layanan</h1>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6 space-y-3"
      >
        <h2 className="font-semibold text-gray-900">Tambah Layanan</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Layanan <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="mis. Potong rambut"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <input
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durasi (menit) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm((s) => ({ ...s, durationMinutes: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menambah..." : "Tambah Layanan"}
        </button>
      </form>

      <h2 className="font-semibold text-gray-900 mb-3">Daftar Layanan</h2>
      {services.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada layanan.</p>
      ) : (
        <div className="space-y-2">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between ${
                !svc.isActive ? "opacity-50" : ""
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{svc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {svc.durationMinutes} menit · {formatPrice(svc.price)}
                </p>
              </div>
              <button
                onClick={() => toggleActive(svc)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  svc.isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {svc.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
