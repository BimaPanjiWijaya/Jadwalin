"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const roles = [
  { value: "CUSTOMER", label: "Customer", desc: "Saya mau booking layanan" },
  {
    value: "BUSINESS_OWNER",
    label: "Business Owner",
    desc: "Saya mau kelola bisnis & jadwal",
  },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!role) {
      setError("Pilih salah satu dulu yah");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.refresh();
      router.push("/");
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Satu langkah lagi
        </h1>
        <p className="text-gray-500 mb-6">
          Kamu mau pakai Jadwalin sebagai apa?
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {roles.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={`w-full text-left border rounded-xl px-4 py-3 transition-colors ${
                role === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <p
                className={`font-semibold ${role === opt.value ? "text-blue-600" : "text-gray-900"}`}
              >
                {opt.label}
              </p>
              <p className="text-sm text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Lanjutkan"}
        </button>
      </div>
    </div>
  );
}
