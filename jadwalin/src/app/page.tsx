import { prisma } from "@/src/lib/prisma";
import BusinessCard from "../components/BusinessCard";
import Link from "next/link";

const CATEGORIES = [
  "Semua",
  "barbershop",
  "salon",
  "klinik",
  "gym",
  "fotografer",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      ...(category && category !== "Semua" ? { category } : {}),
    },
    include: { services: { where: { isActive: true }, take: 3 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-900 mb-3">
          Temukan & Booking Layanan
        </h1>
        <p className="text-gray-500 text-lg">
          Jadwalkan dengan mudah dan cepat
        </p>
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 flex-wrap justify-center mb-8">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === "Semua" ? "/" : `/?category=${cat}`}
            className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
              category === cat || (!category && cat === "Semua")
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 bg-white"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Grid bisnis */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((biz) => (
          <BusinessCard
            key={biz.id}
            slug={biz.slug}
            name={biz.name}
            category={biz.category}
            address={biz.address}
            logoUrl={biz.logoUrl}
            services={biz.services}
          />
        ))}
        {businesses.length === 0 && (
          <div className="col-span-3 text-center py-20">
            <p className="text-gray-400 text-lg">Belum ada bisnis tersedia.</p>
          </div>
        )}
      </div>
    </main>
  );
}
