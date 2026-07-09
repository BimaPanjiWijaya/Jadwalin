const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DONE: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  CANCELLED: "Dibatalkan",
  DONE: "Selesai",
};

export default function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-2.5 py-1
            rounded-full font-medium ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
