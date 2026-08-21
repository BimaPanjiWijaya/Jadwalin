"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: String;
  logoUrl: String | null;
  businessName: String;
};

export default function BusinessLogoUploader({
  businessId,
  logoUrl,
  businessName,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(`/api/businesses/${businessId}/logo`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Gagal upload logo");
        return;
      }
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-50 border border-gray-200 flex items-center justify-center shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-blue-200">
            {businessName.charAt(0)}
          </span>
        )}
      </div>
      <div>
        <label
          htmlFor="logo-upload"
          className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
        >
          {loading ? "Mengupload..." : logoUrl ? "Ganti logo" : "Upload logo"}
        </label>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
