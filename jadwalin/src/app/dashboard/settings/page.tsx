"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  waNumber: string | null;
};

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    phone: "",
    waNumber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/businesses?mine=1");
        const data: Business[] = await res.json();
        if (data.length > 0) {
          const b = data[0];
          setBusiness(b);
          setForm({
            name: b.name,
            category: b.category,
            description: b.description || "",
            address: b.address || "",
            phone: b.phone || "",
            waNumber: b.waNumber || "",
          });
        }
      } catch {
        setError("Gagal memuat data bisnis");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.category.trim()) {
      setError("Nama dan kategori wajib diisi");
      return;
    }
    if (!business) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Gagal menyimpan perubahan");
        return;
      }
      setSuccess("Perubahan berhasil disimpan");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-500">Kamu belum punya bisnis.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Pengaturan Bisnis
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Bisnis <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori <span className="text-red-500">*</span>
          </label>
          <input
            value={form.category}
            onChange={(e) =>
              setForm((s) => ({ ...s, category: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <input
              value={form.address}
              onChange={(e) =>
                setForm((s) => ({ ...s, address: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telepon
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((s) => ({ ...s, phone: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nomor WhatsApp
          </label>
          <input
            value={form.waNumber}
            onChange={(e) =>
              setForm((s) => ({ ...s, waNumber: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </main>
  );
}
