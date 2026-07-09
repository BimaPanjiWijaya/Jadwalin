"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.role) {
      setError("Role Wajib Dipilih");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push("/login");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex">
      {/* Kiri — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-blue-600 p-12 text-white">
        <span className="text-2xl font-bold tracking-tight">Jadwalin</span>
        <div>
          <h2 className="text-4xl font-bold leading-snug mb-4">
            Mulai terima booking
            <br />
            dari sekarang
          </h2>
          <p className="text-blue-100 text-lg">
            Daftarkan bisnis atau temukan layanan terbaik di sekitarmu.
          </p>
        </div>
        <p className="text-blue-200 text-sm">© 2026 Jadwalin</p>
      </div>

      {/* Kanan — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Buat akun</h1>
            <p className="text-gray-500 mt-1">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Nama Kamu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="kamu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daftar sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "CUSTOMER",
                    label: "Customer",
                    desc: "Cari & booking layanan",
                  },
                  {
                    value: "BUSINESS_OWNER",
                    label: "Business Owner",
                    desc: "Kelola bisnis & terima booking",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: opt.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.role === opt.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${form.role === opt.value ? "text-blue-600" : "text-gray-900"}`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Membuat akun..." : "Buat Akun"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
