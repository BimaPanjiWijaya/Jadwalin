import Link from "next/link";

type Service = { id: string; name: string };

type Props = {
  slug: string;
  name: string;
  category: string;
  address?: string | null;
  logoUrl?: string | null;
  services: Service[];
};

export default function BusinessCard({
  slug,
  name,
  category,
  address,
  logoUrl,
  services,
}: Props) {
  return (
    <Link
      href={`/book/${slug}`}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <span className="text-5xl font-bold text-blue-200">
            {name.charAt(0)}
          </span>
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {name}
        </h2>
        <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium mt-1 capitalize">
          {category}
        </span>
        {address && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {address}
          </p>
        )}
        {services.length > 0 && (
          <div className="mt-3 flex gap-1 flex-wrap">
            {services.map((svc) => (
              <span
                key={svc.id}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {svc.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
