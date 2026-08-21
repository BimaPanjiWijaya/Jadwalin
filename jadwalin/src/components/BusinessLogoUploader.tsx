"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  logoUrl: string | null;
  businessName: string;
  variant?: "card" | "avatar";
  avatarFallback?: string;
};

export default function BusinessLogoUploader({
  businessId,
  logoUrl,
  businessName,
  variant = "card",
  avatarFallback,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputId = `logo-upload-${businessId}-${variant}`;

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

  if (variant === "avatar") {
    const fallbackLetter = (avatarFallback ?? businessName)
      .charAt(0)
      .toUpperCase();
    return (
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-blue-600 font-bold text-lg">
              {fallbackLetter}
            </span>
          )}
        </div>

        <label
          htmlFor={inputId}
          title={loading ? "Mengupload..." : "Ganti logo"}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
        >
          {loading ? (
            <svg
              className="w-3 h-3 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />

        {error && (
          <p className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
            {error}
          </p>
        )}
      </div>
    );
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
          htmlFor={inputId}
          className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
        >
          {loading ? "Mengupload..." : logoUrl ? "Ganti logo" : "Upload logo"}
        </label>
        <input
          id={inputId}
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
