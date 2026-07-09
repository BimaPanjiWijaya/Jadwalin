import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="border-t border-gray-200
        bg-white mt-auto"
    >
      <div
        className="max-w-5xl mx-auto px-4 py-8 flex flex-col
      md:flex-row justify-between items-center gap-4"
      >
        <div>
          <span
            className="text-blue-600 font-bold
            text-lg"
          >
            Jadwalin
          </span>
          <p
            className="text-xs text-gray-400
            mt-1"
          >
            Platform booking & scheduling terpercaya
          </p>
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link
            href="/"
            className="hover:text-blue-600
            transition-colors"
          >
            Beranda
          </Link>
          <Link
            href="/register"
            className="hover:text-blue-600
            transition-colors"
          >
            Daftar
          </Link>
          <Link
            href="/login"
            className="hover:text-blue-600
            transition-colors"
          >
            Masuk
          </Link>
        </div>
        <p className="text-xs text-gray-400">© 2026 Jadwalin</p>
      </div>
    </footer>
  );
}
