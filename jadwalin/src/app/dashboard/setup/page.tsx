"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "",
    description: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function slugify(v: string) {
    return v
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .replace(/\-+/g, "-");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.slug || !form.category) {
      setError("Nama, slug, dan kategori wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Gagal membuat bisnis");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Bisnis</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Bisnis
          </label>
          <input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((s) => ({ ...s, name, slug: s.slug || slugify(name) }));
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug (unik)
          </label>
          <input
            value={form.slug}
            onChange={(e) =>
              setForm((s) => ({ ...s, slug: slugify(e.target.value) }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="contoh: barbershop-pak-rudi"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Slug akan digunakan pada URL publik bisnis.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori
          </label>
          <input
            value={form.category}
            onChange={(e) =>
              setForm((s) => ({ ...s, category: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="mis. barber, salon, klinik"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi (opsional)
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
              Alamat (opsional)
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
              Telepon (opsional)
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

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Buat Bisnis"}
          </button>
        </div>
      </form>
    </main>
  );
}
