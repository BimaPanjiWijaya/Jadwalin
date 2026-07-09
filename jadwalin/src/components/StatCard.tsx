type Props = {
  label: string;
  value: number | string;
  color?: string;
};

export default function StatCard({
  label,
  value,
  color = "text-blue-600",
}: Props) {
  return (
    <div
      className="bg-white border
             border-gray-200 rounded-2xl p-5 text-center
             shadow-sm"
    >
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
