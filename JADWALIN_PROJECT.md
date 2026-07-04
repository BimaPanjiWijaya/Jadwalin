# Jadwalin — Booking & Scheduling Platform

> Panduan lengkap pengerjaan dari setup hingga deployment
> Stack: Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · JWT · Telegram Bot · Tailwind CSS

---

## Daftar isi

1. [Tech stack](#1-tech-stack)
2. [Persiapan awal](#2-persiapan-awal)
3. [Setup Git & GitHub](#3-setup-git--github)
4. [Init project](#4-init-project)
5. [Setup database — Supabase](#5-setup-database--supabase)
6. [Setup Prisma 7 & migrasi](#6-setup-prisma-7--migrasi)
7. [Setup Auth — JWT manual](#7-setup-auth--jwt-manual)
8. [Setup notifikasi — Email + Telegram Bot](#8-setup-notifikasi--email--telegram-bot)
9. [Pengerjaan fitur minggu per minggu](#9-pengerjaan-fitur-minggu-per-minggu)
10. [Setup notifikasi — Email + Telegram + Vercel Cron](#10-setup-notifikasi--email--telegram--vercel-cron)
11. [Testing](#11-testing)
12. [Deployment — Vercel](#12-deployment--vercel)
13. [Checklist final](#13-checklist-final)

---

## 1. Tech stack

| Layer       | Teknologi        | Versi             | Keterangan                                       |
| ----------- | ---------------- | ----------------- | ------------------------------------------------ |
| Framework   | Next.js          | 16.2 (App Router) | Frontend + API Routes sekaligus                  |
| Bahasa      | TypeScript       | 5.x               | Type safety di seluruh codebase                  |
| Styling     | Tailwind CSS     | 4.x               | Utility-first CSS                                |
| ORM         | Prisma           | 7.x               | Type-safe, rust-free, lebih cepat                |
| Database    | PostgreSQL       | 15                | Via Supabase (free tier)                         |
| Auth        | **JWT manual**   | —                 | jsonwebtoken + bcryptjs, dipahami dari dasar     |
| Email       | Nodemailer       | latest            | Gmail SMTP, gratis                               |
| Notifikasi  | Telegram Bot API | —                 | Notif instan via bot, gratis                     |
| File upload | Cloudinary       | latest            | Logo bisnis (free 25GB)                          |
| Deploy      | Vercel           | —                 | Frontend + API Routes + Cron Jobs, semua di sini |

### Kenapa JWT manual, bukan library auth?

JWT adalah fondasi autentikasi yang wajib dipahami sebelum pakai library apapun.
Dengan implementasi manual, kamu benar-benar paham cara kerja token, hashing password,
middleware validasi, dan refresh token — semua hal yang sering ditanyakan di technical interview.
Ini jauh lebih impressive di portofolio dibanding sekadar install library.

---

## Struktur folder

```
jadwalin/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (customer)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  ← home: daftar bisnis
│   │   │   ├── book/
│   │   │   │   └── [slug]/page.tsx       ← halaman booking
│   │   │   └── my-bookings/page.tsx      ← riwayat booking
│   │   ├── (business)/
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       ├── page.tsx              ← overview hari ini
│   │   │       ├── slots/page.tsx        ← kelola slot
│   │   │       └── bookings/page.tsx     ← daftar booking masuk
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts     ← POST register
│   │       │   ├── login/route.ts        ← POST login
│   │       │   ├── logout/route.ts       ← POST logout
│   │       │   └── me/route.ts           ← GET user yang sedang login
│   │       ├── profile/
│   │       │   └── telegram/route.ts     ← POST/DELETE connect Telegram
│   │       ├── telegram/
│   │       │   └── webhook/route.ts      ← POST webhook dari Telegram
│   │       ├── businesses/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── slots/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── generate/route.ts     ← POST generate slot otomatis
│   │       ├── bookings/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── services/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── cron/
│   │           └── reminder/route.ts     ← GET dipanggil Vercel Cron jam 09.00 WIB
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Input.tsx
│   │   ├── booking/
│   │   │   ├── CalendarPicker.tsx
│   │   │   ├── SlotGrid.tsx
│   │   │   └── BookingSummary.tsx
│   │   └── dashboard/
│   │       ├── BookingTable.tsx
│   │       ├── SlotManager.tsx
│   │       └── StatCard.tsx
│   ├── lib/
│   │   ├── prisma.ts             ← singleton Prisma client
│   │   ├── jwt.ts                ← helper sign & verify token
│   │   ├── auth.ts               ← helper getSession dari request
│   │   ├── mailer.ts             ← Nodemailer — email konfirmasi & reminder
│   │   └── telegram.ts           ← Telegram Bot — notifikasi instan
│   ├── proxy.ts                  ← Next.js 16: proteksi route (pengganti middleware.ts)
│   └── types/
│       └── index.ts              ← shared TypeScript types
├── .env.local                    ← JANGAN di-commit
├── .env.example
├── vercel.json                   ← konfigurasi cron job
├── .gitignore
└── package.json
```

> **Catatan Next.js 16:** File proteksi route sekarang bernama `proxy.ts`,
> bukan `middleware.ts` seperti di versi sebelumnya.

### Buat shared TypeScript types — `src/types/index.ts`

File ini berisi semua tipe yang dipakai berulang di seluruh project supaya tidak perlu define ulang di setiap file.

```typescript
// Tipe user session dari JWT
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "BUSINESS_OWNER";
  telegramChatId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "BUSINESS_OWNER";
  telegramChatId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Tipe response bisnis
export interface BusinessWithServices {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
}

// Tipe slot dengan status
export interface SlotWithBookingCount {
  id: string;
  slotDate: Date;
  startTime: Date;
  endTime: Date;
  maxCapacity: number;
  status: "AVAILABLE" | "FULL" | "BLOCKED";
  service: Service;
  _count: { bookings: number };
}

// Tipe booking lengkap
export interface BookingWithDetails {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  notes: string | null;
  bookedAt: Date;
  slot: {
    slotDate: Date;
    startTime: Date;
    endTime: Date;
    business: { name: string; address: string | null };
    service: { name: string; price: number };
  };
  customer: { name: string; email: string; phone: string | null };
}

// Tipe untuk API response generik
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
```

---

## 2. Persiapan awal

### Tools yang harus terinstall

```bash
node --version      # minimal v20 (Next.js 16 butuh Node 20+)
npm --version       # minimal v10
git --version
```

> Kalau Node.js belum v20, download di https://nodejs.org (pilih LTS)

### Akun yang perlu dibuat sebelum mulai

- [Supabase](https://supabase.com) — database PostgreSQL gratis
- [Vercel](https://vercel.com) — deploy semua (frontend + API + Cron)
- [Cloudinary](https://cloudinary.com) — upload gambar gratis
- Gmail biasa — untuk notifikasi email (butuh aktifkan 2FA dulu)

---

## 3. Setup Git & GitHub

Lakukan ini **sebelum** init project supaya semua kode langsung ter-track dari awal.

```bash
# Pastikan git sudah terkonfigurasi dengan identitasmu
git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"
```

Buat repo baru di [github.com](https://github.com/new):

- Repository name: `jadwalin`
- Visibility: **Public** (supaya bisa dilihat recruiter)
- Jangan centang "Add README" — kita akan push dari lokal

```bash
# Setelah project dibuat (langkah 4), init git di folder project
git init
git add .
git commit -m "feat: initial project setup"

# Hubungkan ke GitHub
git remote add origin https://github.com/USERNAME/jadwalin.git
git branch -M main
git push -u origin main
```

> Ganti `USERNAME` dengan username GitHub kamu.

### Alur commit yang direkomendasikan

Commit setiap kali satu fitur selesai, pakai format ini:

```
feat: add POST /api/auth/register
feat: add login page UI
feat: add GET /api/businesses with category filter
feat: add booking conflict check with transaction
fix: handle expired JWT token in proxy.ts
chore: add seed data for 7 days of slots
```

Format ini disebut **Conventional Commits** — terlihat profesional di GitHub dan sering dipakai di perusahaan.

---

## 4. Init project

```bash
# Buat project Next.js 16 baru
npx create-next-app@latest jadwalin --typescript --tailwind --app

# Jawab pertanyaan seperti ini:
# Would you like to use ESLint? → Yes
# Would you like to use src/ directory? → Yes
# Would you like to customize the import alias? → No

cd jadwalin

# Install semua dependencies sekaligus
npm install @prisma/client @prisma/adapter-pg pg jsonwebtoken bcryptjs nodemailer cloudinary

npm install -D prisma @types/jsonwebtoken @types/bcryptjs @types/nodemailer @types/pg ts-node

# Init Prisma
npx prisma init
```

### Setup .gitignore

Pastikan `.gitignore` sudah berisi minimal:

```
.env.local
.env
node_modules/
.next/
```

### Buat file .env.example

```env
DATABASE_URL=""
JWT_SECRET=""
JWT_EXPIRES_IN="7d"
GMAIL_USER=""
GMAIL_APP_PASSWORD=""
TELEGRAM_BOT_TOKEN=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=""
CRON_SECRET=""
```

---

## 5. Setup database — Supabase

1. Buka [supabase.com](https://supabase.com) → **New project**
2. Isi nama project: `jadwalin`, region: **Southeast Asia (Singapore)**
3. Buat password database yang kuat — simpan, karena tidak bisa dilihat lagi
4. Tunggu project selesai dibuat (~2 menit)
5. Pergi ke **Settings → Database → Connection string**
6. Copy dua jenis URL berikut dan paste ke `.env`:

```env
# .env (bukan .env.local — keduanya sudah di-ignore oleh .gitignore)

# Connection pooler (port 6543) — untuk runtime Next.js
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Direct connection (port 5432) — untuk migrasi Prisma
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

> **Catatan Prisma 7:** `prisma.config.ts` menggunakan `DIRECT_URL` untuk migrasi
> dan `DATABASE_URL` sebagai fallback. Pastikan keduanya diisi.

---

## 6. Setup Prisma 7 & migrasi

### Copy schema

Hapus isi `prisma/schema.prisma`, paste schema berikut:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // Catatan Prisma 7: url tidak ditaruh di sini.
  // Koneksi dikelola oleh prisma.config.ts via DIRECT_URL / DATABASE_URL
}

enum Role {
  CUSTOMER
  BUSINESS_OWNER
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

enum SlotStatus {
  AVAILABLE
  FULL
  BLOCKED
}

enum NotificationChannel {
  EMAIL
  TELEGRAM
  ALL
}

enum NotificationStatus {
  QUEUED
  SENT
  FAILED
}

model User {
  id             String   @id @default(uuid())
  name           String
  email          String   @unique
  phone          String?
  password       String
  role           Role     @default(CUSTOMER)
  telegramChatId String?  @map("telegram_chat_id") // dari bot /start
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  businesses    Business[]
  bookings      Booking[]
  notifications Notification[]

  @@map("users")
}

model Business {
  id          String   @id @default(uuid())
  ownerId     String   @map("owner_id")
  name        String
  slug        String   @unique
  category    String
  description String?
  address     String?
  phone       String?
  waNumber    String?  @map("wa_number")
  logoUrl     String?  @map("logo_url")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  owner    User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  services Service[]
  slots    Slot[]

  @@map("businesses")
}

model Service {
  id              String   @id @default(uuid())
  businessId      String   @map("business_id")
  name            String
  description     String?
  durationMinutes Int      @map("duration_minutes")
  price           Int      @default(0)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  slots    Slot[]

  @@map("services")
}

model Slot {
  id          String     @id @default(uuid())
  businessId  String     @map("business_id")
  serviceId   String     @map("service_id")
  slotDate    DateTime   @map("slot_date") @db.Date
  startTime   DateTime   @map("start_time") @db.Time
  endTime     DateTime   @map("end_time") @db.Time
  maxCapacity Int        @default(1) @map("max_capacity")
  status      SlotStatus @default(AVAILABLE)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  business Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  service  Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  bookings Booking[]

  @@index([businessId, slotDate])
  @@index([serviceId, slotDate])
  @@map("slots")
}

model Booking {
  id         String        @id @default(uuid())
  slotId     String        @map("slot_id")
  customerId String        @map("customer_id")
  status     BookingStatus @default(PENDING)
  notes      String?
  bookedAt   DateTime      @default(now()) @map("booked_at")
  remindedAt DateTime?     @map("reminded_at")
  updatedAt  DateTime      @updatedAt @map("updated_at")

  slot          Slot           @relation(fields: [slotId], references: [id], onDelete: Cascade)
  customer      User           @relation(fields: [customerId], references: [id], onDelete: Cascade)
  notifications Notification[]

  @@unique([slotId, customerId])
  @@index([customerId])
  @@index([slotId])
  @@map("bookings")
}

model Notification {
  id        String              @id @default(uuid())
  bookingId String              @map("booking_id")
  userId    String              @map("user_id")
  channel   NotificationChannel
  type      String
  status    NotificationStatus  @default(QUEUED)
  sentAt    DateTime?           @map("sent_at")
  errorMsg  String?             @map("error_msg")
  createdAt DateTime            @default(now()) @map("created_at")

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([status, createdAt])
  @@map("notifications")
}
```

### Jalankan migrasi

```bash
# Buat dan jalankan migrasi pertama
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Lihat database di browser (sangat berguna saat development)
npx prisma studio
# Buka http://localhost:5555
```

### Buat Prisma singleton client

Buat `src/lib/prisma.ts`:

> **Catatan Prisma 7:** Koneksi database dikonfigurasi di `prisma.config.ts`, bukan di dalam kode client.
> Tidak perlu `PrismaPg` adapter di sini.

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Buat seed data

Buat `prisma/seed.ts`:

```typescript
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "rudi@jadwalin.id" },
    update: {},
    create: {
      name: "Pak Rudi",
      email: "rudi@jadwalin.id",
      password: await bcrypt.hash("password123", 10),
      role: Role.BUSINESS_OWNER,
      phone: "08123456789",
    },
  });

  await prisma.user.upsert({
    where: { email: "bima@jadwalin.id" },
    update: {},
    create: {
      name: "Bima Panji",
      email: "bima@jadwalin.id",
      password: await bcrypt.hash("password123", 10),
      role: Role.CUSTOMER,
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: "barbershop-pak-rudi" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Barbershop Pak Rudi",
      slug: "barbershop-pak-rudi",
      category: "barbershop",
      description: "Barbershop terpercaya sejak 2010",
      address: "Jl. Mawar No. 12, Yogyakarta",
      phone: "08123456789",
    },
  });

  const service = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Potong rambut",
      durationMinutes: 30,
      price: 35000,
    },
  });

  const today = new Date();
  const times = [
    ["09:00", "09:30"],
    ["09:30", "10:00"],
    ["10:00", "10:30"],
    ["10:30", "11:00"],
    ["11:00", "11:30"],
    ["13:00", "13:30"],
    ["13:30", "14:00"],
    ["14:00", "14:30"],
    ["14:30", "15:00"],
  ];

  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);

    for (const [start, end] of times) {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);

      await prisma.slot.create({
        data: {
          businessId: business.id,
          serviceId: service.id,
          slotDate: date,
          startTime: new Date(0, 0, 0, sh, sm),
          endTime: new Date(0, 0, 0, eh, em),
          maxCapacity: 1,
        },
      });
    }
  }

  console.log("Seed berhasil!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

> **Catatan Prisma 7:** Seed config **tidak** ditaruh di `package.json`.
> Sudah otomatis terkonfigurasi di `prisma.config.ts`:
>
> ```ts
> migrations: {
>   seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
> }
> ```

```bash
npx prisma db seed
```

---

## 7. Setup Auth — JWT manual

Tambahkan ke `.env.local`:

```env
JWT_SECRET="isi-dengan-random-string-panjang-minimal-32-karakter"
JWT_EXPIRES_IN="7d"
# Generate: openssl rand -base64 32
```

### Konsep JWT yang perlu dipahami

```
1. User login → server verifikasi email + password
2. Password cocok → server buat JWT token berisi { id, email, role }
3. Token dikirim ke client → disimpan di httpOnly cookie (aman dari XSS)
4. Setiap request berikutnya → client kirim cookie → server verifikasi token
5. Token valid → lanjutkan request, token invalid → tolak dengan 401
```

### Buat JWT helper — `src/lib/jwt.ts`

```typescript
import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Buat token baru
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Verifikasi token, return null kalau invalid
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
```

> **Catatan:** `expiresIn` di `@types/jsonwebtoken` versi terbaru menggunakan tipe `ms.StringValue`
> yang lebih ketat dari `string` biasa. Cast via `SignOptions["expiresIn"]` adalah cara yang benar.

```typescript
import { cookies } from "next/headers";
import { verifyToken, JwtPayload } from "@/src/lib/jwt";

// Ambil session dari cookie di server component / API route
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  return verifyToken(token);
}
```

### Buat API register — `src/app/api/auth/register/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/src/lib/jwt";

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json();

  // Validasi input
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Semua field wajib diisi" },
      { status: 400 },
    );
  }

  // Cek email sudah terdaftar atau belum
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 400 },
    );
  }

  // Hash password — JANGAN simpan plain text
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan user ke database
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role === "BUSINESS_OWNER" ? "BUSINESS_OWNER" : "CUSTOMER",
    },
  });

  // Buat JWT token
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  // Kirim token via httpOnly cookie (aman dari XSS)
  const response = NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    { status: 201 },
  );
  response.cookies.set("token", token, {
    httpOnly: true, // tidak bisa diakses JavaScript di browser
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  });

  return response;
}
```

### Buat API login — `src/app/api/auth/login/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/src/lib/jwt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi" },
      { status: 400 },
    );
  }

  // Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Jangan bilang "email tidak ditemukan" — rawan enumerasi user
    return NextResponse.json(
      { error: "Email atau password salah" },
      { status: 401 },
    );
  }

  // Bandingkan password dengan hash di database
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Email atau password salah" },
      { status: 401 },
    );
  }

  // Buat token baru
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
```

### Buat API logout — `src/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout berhasil" });

  // Hapus cookie token
  response.cookies.set("token", "", {
    httpOnly: true,
    maxAge: 0, // langsung expired
    path: "/",
  });

  return response;
}
```

### Buat API me — `src/app/api/auth/me/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, phone: true },
  });

  return NextResponse.json(user);
}
```

### Buat proxy.ts — proteksi route

> Next.js 16: file ini bernama `proxy.ts`, bukan `middleware.ts`

Buat `src/proxy.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/src/lib/jwt";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ambil token dari cookie
  const token = req.cookies.get("token")?.value;
  const session = token ? verifyToken(token) : null;

  const protectedRoutes = ["/my-bookings", "/book", "/dashboard"];
  const needsAuth = protectedRoutes.some((r) => pathname.startsWith(r));

  // Belum login tapi akses halaman protected → redirect ke login
  if (needsAuth && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Sudah login tapi buka halaman login/register → redirect ke home
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Dashboard hanya untuk BUSINESS_OWNER
  if (pathname.startsWith("/dashboard") && session?.role !== "BUSINESS_OWNER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Buat halaman Register — `src/app/(auth)/register/page.tsx`

> Folder `(auth)` adalah route group di Next.js — tidak mempengaruhi URL.
> Halaman ini bisa diakses di `/register`.

```tsx
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
    role: "",  // kosong agar select menampilkan "Pilih Role" dulu
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.role) {
      setError("Role wajib dipilih");
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
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 border rounded-lg">
        <h1 className="text-2xl font-bold text-center">Daftar</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Nama lengkap"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password (min. 8 karakter)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="" disabled>Pilih Role</option>
          <option value="CUSTOMER">Customer</option>
          <option value="BUSINESS_OWNER">Business Owner</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>

        <p className="text-sm text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
```

---

### Buat halaman Login — `src/app/(auth)/login/page.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 border rounded-lg">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Login"}
        </button>

        <p className="text-sm text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-600 underline">Daftar</Link>
        </p>
      </form>
    </div>
  );
}
```

---

### Cara pakai session di halaman

```typescript
// Di server component (page.tsx, layout.tsx)
import { getSession } from '@/src/lib/auth'

export default async function DashboardPage() {
  const session = await getSession()
  // session = { id, email, role } atau null

  return <div>Halo, {session?.email}</div>
}

// Di API route
import { getSession } from '@/src/lib/auth'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // session.id → id user yang sedang login
  // session.role → 'CUSTOMER' atau 'BUSINESS_OWNER'
}
```

---

## 8. Setup notifikasi — Email + Telegram Bot

Jadwalin menggunakan dua channel notifikasi sekaligus:

- **Email** via Gmail SMTP — untuk dokumentasi resmi dan user yang tidak pakai Telegram
- **Telegram Bot** — untuk notifikasi instan yang langsung terbaca

### Setup Gmail App Password

1. Buka [myaccount.google.com](https://myaccount.google.com)
2. **Security → 2-Step Verification** → aktifkan kalau belum
3. **Security → App Passwords** → buat baru → nama: "Jadwalin"
4. Copy 16 karakter yang muncul

```env
GMAIL_USER="emailkamu@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

### Setup Telegram Bot

1. Buka Telegram → cari `@BotFather`
2. Ketik `/newbot`
3. Ikuti instruksi — isi nama bot: `Jadwalin` dan username: `jadwalin_bot`
4. Copy **BOT_TOKEN** yang diberikan BotFather
5. Simpan juga username bot untuk ditampilkan ke user di halaman profil

```env
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="jadwalin_bot"
```

### Cara user connect Telegram

User perlu melakukan ini sekali saja:

```
1. User buka halaman profil di Jadwalin
2. Klik tombol "Connect Telegram"
3. Diarahkan ke t.me/jadwalin_bot
4. Klik START di bot → bot balas dengan chat_id mereka
5. User copy chat_id → paste di halaman profil → simpan
```

Atau bisa lebih otomatis dengan Telegram webhook (opsional, bisa ditambahkan nanti).

### Buat `src/lib/mailer.ts`

```typescript
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBookingConfirmationEmail(
  to: string,
  data: {
    customerName: string;
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    bookingCode: string;
  },
) {
  await transporter.sendMail({
    from: `"Jadwalin" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Booking dikonfirmasi — ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Booking kamu berhasil!</h2>
        <p>Halo ${data.customerName},</p>
        <p>Booking kamu di <strong>${data.businessName}</strong> sudah dikonfirmasi.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:8px;color:#666;">Layanan</td><td style="padding:8px;">${data.serviceName}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Tanggal</td><td style="padding:8px;">${data.date}</td></tr>
          <tr><td style="padding:8px;color:#666;">Waktu</td><td style="padding:8px;">${data.time}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Kode booking</td><td style="padding:8px;font-weight:bold;">${data.bookingCode}</td></tr>
        </table>
        <p style="margin-top:24px;">Sampai jumpa!</p>
        <p style="color:#999;font-size:12px;">— Tim Jadwalin</p>
      </div>
    `,
  });
}

export async function sendReminderEmail(
  to: string,
  data: {
    customerName: string;
    businessName: string;
    date: string;
    time: string;
  },
) {
  await transporter.sendMail({
    from: `"Jadwalin" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Reminder: Booking besok di ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Jangan lupa booking kamu besok!</h2>
        <p>Halo ${data.customerName},</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:8px;color:#666;">Tempat</td><td style="padding:8px;">${data.businessName}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Tanggal</td><td style="padding:8px;">${data.date}</td></tr>
          <tr><td style="padding:8px;color:#666;">Waktu</td><td style="padding:8px;">${data.time}</td></tr>
        </table>
        <p style="color:#999;font-size:12px;margin-top:24px;">— Tim Jadwalin</p>
      </div>
    `,
  });
}
```

### Buat `src/lib/telegram.ts`

Tidak perlu install library — cukup pakai `fetch` bawaan Next.js.

```typescript
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Kirim pesan teks ke user via chat_id
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Telegram error:", err);
    throw new Error(`Telegram gagal: ${err.description}`);
  }
}

// Notifikasi konfirmasi booking
export async function sendBookingConfirmationTelegram(
  chatId: string,
  data: {
    customerName: string;
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    bookingCode: string;
  },
) {
  const text = `
✅ *Booking Dikonfirmasi!*

Halo ${data.customerName}, booking kamu sudah berhasil.

📍 *${data.businessName}*
💈 ${data.serviceName}
📅 ${data.date}
🕐 ${data.time}
🔖 Kode: \`${data.bookingCode}\`

Sampai jumpa! 👋
  `.trim();

  await sendTelegramMessage(chatId, text);
}

// Notifikasi reminder H-1
export async function sendReminderTelegram(
  chatId: string,
  data: {
    customerName: string;
    businessName: string;
    date: string;
    time: string;
  },
) {
  const text = `
⏰ *Reminder Booking Besok!*

Halo ${data.customerName}, jangan lupa booking kamu besok ya!

📍 *${data.businessName}*
📅 ${data.date}
🕐 ${data.time}

Sampai jumpa! 👋
  `.trim();

  await sendTelegramMessage(chatId, text);
}
```

### Buat API untuk simpan Telegram Chat ID — `src/app/api/profile/telegram/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// POST /api/profile/telegram
// Body: { telegramChatId: "123456789" }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { telegramChatId } = await req.json();

  if (!telegramChatId) {
    return NextResponse.json(
      { error: "telegramChatId wajib diisi" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: { telegramChatId },
    select: { id: true, name: true, telegramChatId: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/profile/telegram — disconnect Telegram
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.id },
    data: { telegramChatId: null },
  });

  return NextResponse.json({ message: "Telegram berhasil diputus" });
}
```

### Buat API Telegram Webhook — `src/app/api/telegram/webhook/route.ts`

Webhook ini dipanggil Telegram setiap kali user kirim pesan ke bot.
Saat user ketik `/start`, bot langsung balas dengan chat_id mereka.

```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat.id.toString();
  const text = message.text || "";

  // Kalau user ketik /start, balas dengan chat_id mereka
  if (text.startsWith("/start")) {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Halo! 👋 Selamat datang di Jadwalin Bot.\n\nChat ID kamu adalah:\n\`${chatId}\`\n\nCopy angka di atas dan paste di halaman profil Jadwalin kamu untuk mengaktifkan notifikasi Telegram.`,
          parse_mode: "Markdown",
        }),
      },
    );
  }

  return NextResponse.json({ ok: true });
}
```

### Daftarkan webhook ke Telegram

Jalankan perintah ini **sekali saja setelah deploy ke Vercel** — bukan sekarang.
Langkah lengkapnya ada di bagian Deployment (bagian 12).

---

## 8a. Setup file upload — Cloudinary

Cloudinary digunakan untuk upload logo bisnis. Free tier sudah cukup (25GB).

### Daftar & setup akun

1. Buka [cloudinary.com](https://cloudinary.com) → **Sign Up** (gratis)
2. Setelah login, buka **Dashboard**
3. Copy tiga nilai berikut dari bagian **Product Environment Credentials**:
   - **Cloud name**
   - **API key**
   - **API secret**

```env
# Tambahkan ke .env.local
CLOUDINARY_CLOUD_NAME="nama-cloud-kamu"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Buat helper — `src/lib/cloudinary.ts`

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload gambar dari buffer, return URL publik
export async function uploadImage(
  buffer: Buffer,
  folder: string = "jadwalin",
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}

// Hapus gambar berdasarkan public_id
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

### Cara pakai di API route

```typescript
// Contoh: upload logo bisnis di src/app/api/businesses/[id]/logo/route.ts
import { NextResponse } from "next/server";
import { uploadImage } from "@/src/lib/cloudinary";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("logo") as File;

  if (!file) {
    return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
  }

  // Validasi tipe file
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Hanya file gambar yang diizinkan" },
      { status: 400 },
    );
  }

  // Validasi ukuran (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Ukuran file maksimal 2MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = await uploadImage(buffer, "jadwalin/logos");

  // Simpan URL ke database
  await prisma.business.update({
    where: { id },
    data: { logoUrl },
  });

  return NextResponse.json({ logoUrl });
}
```

---

## 9. Pengerjaan fitur minggu per minggu

### Minggu 1 — Fondasi & Auth

- [ ] `npm run dev` berjalan tanpa error di `localhost:3000`
- [ ] Schema Prisma sudah di-migrate ke Supabase
- [ ] Seed data berhasil: `npx prisma db seed`
- [ ] `src/lib/jwt.ts` sudah dibuat
- [ ] `src/lib/auth.ts` sudah dibuat
- [ ] API `POST /api/auth/register` bekerja
- [ ] API `POST /api/auth/login` bekerja
- [ ] API `POST /api/auth/logout` bekerja
- [ ] API `GET /api/auth/me` bekerja
- [ ] `proxy.ts` melindungi route yang butuh login
- [ ] Halaman `/register` — form + fetch ke `/api/auth/register`
- [ ] Halaman `/login` — form + fetch ke `/api/auth/login`
- [ ] Tes lengkap: register → login → cek `/api/auth/me` → logout

---

### Minggu 2 — Core booking flow

- [ ] API `GET /api/businesses` — list bisnis aktif
- [ ] API `GET /api/businesses/[id]` — detail bisnis + services
- [ ] API `GET /api/slots?businessId=&date=` — slot tersedia per tanggal
- [ ] API `POST /api/bookings` — buat booking + conflict check
- [ ] API `GET /api/bookings?customerId=` — riwayat booking customer
- [ ] Halaman `/` — home: list bisnis + filter kategori
- [ ] Halaman `/book/[slug]` — kalender + slot picker + konfirmasi
- [ ] Halaman `/my-bookings` — riwayat booking customer
- [ ] Komponen: `CalendarPicker`, `SlotGrid`, `BookingSummary`

**API businesses — `src/app/api/businesses/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/businesses?category=barbershop
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    include: {
      services: { where: { isActive: true } },
      _count: { select: { slots: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(businesses);
}

// POST /api/businesses — buat bisnis baru (business owner)
export async function POST(req: Request) {
  const { getSession } = await import("@/src/lib/auth");
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug, category, description, address, phone } =
    await req.json();

  if (!name || !slug || !category) {
    return NextResponse.json(
      { error: "name, slug, dan category wajib diisi" },
      { status: 400 },
    );
  }

  const exists = await prisma.business.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json({ error: "Slug sudah dipakai" }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: {
      ownerId: session.id,
      name,
      slug,
      category,
      description,
      address,
      phone,
    },
  });

  return NextResponse.json(business, { status: 201 });
}
```

**API business detail — `src/app/api/businesses/[id]/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/businesses/[id] — bisa pakai id atau slug
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const business = await prisma.business.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    include: {
      services: { where: { isActive: true } },
      owner: { select: { name: true, email: true } },
    },
  });

  if (!business) {
    return NextResponse.json(
      { error: "Bisnis tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json(business);
}

// PATCH /api/businesses/[id] — edit profil bisnis
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { getSession } = await import("@/src/lib/auth");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findUnique({
    where: { id },
  });
  if (!business || business.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const updated = await prisma.business.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
```

**API slots — `src/app/api/slots/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/slots?businessId=xxx&date=2025-06-14
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");

  if (!businessId || !date) {
    return NextResponse.json(
      { error: "businessId dan date wajib diisi" },
      { status: 400 },
    );
  }

  const slotDate = new Date(date);
  const nextDate = new Date(slotDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const slots = await prisma.slot.findMany({
    where: {
      businessId,
      slotDate: { gte: slotDate, lt: nextDate },
      status: { not: "BLOCKED" },
    },
    include: {
      service: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}

// POST /api/slots — buat slot baru (business owner)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessId, serviceId, slotDate, startTime, endTime, maxCapacity } =
    await req.json();

  // Verifikasi bisnis milik owner ini
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const slot = await prisma.slot.create({
    data: {
      businessId,
      serviceId,
      slotDate: new Date(slotDate),
      startTime: new Date(`1970-01-01T${startTime}:00`),
      endTime: new Date(`1970-01-01T${endTime}:00`),
      maxCapacity: maxCapacity || 1,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}
```

**API slot update — `src/app/api/slots/[id]/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// PATCH /api/slots/[id] — block atau unblock slot
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();

  // Pastikan slot milik bisnis yang dimiliki owner ini
  const slot = await prisma.slot.findFirst({
    where: { id, business: { ownerId: session.id } },
  });
  if (!slot)
    return NextResponse.json(
      { error: "Slot tidak ditemukan" },
      { status: 404 },
    );

  const updated = await prisma.slot.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}

// DELETE /api/slots/[id] — hapus slot (hanya kalau belum ada booking)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slot = await prisma.slot.findFirst({
    where: { id, business: { ownerId: session.id } },
    include: { _count: { select: { bookings: true } } },
  });

  if (!slot)
    return NextResponse.json(
      { error: "Slot tidak ditemukan" },
      { status: 404 },
    );
  if (slot._count.bookings > 0) {
    return NextResponse.json(
      { error: "Tidak bisa hapus slot yang sudah ada booking" },
      { status: 400 },
    );
  }

  await prisma.slot.delete({ where: { id } });
  return NextResponse.json({ message: "Slot berhasil dihapus" });
}
```

**API services — `src/app/api/services/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/services?businessId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json(
      { error: "businessId wajib diisi" },
      { status: 400 },
    );
  }

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(services);
}

// POST /api/services — tambah layanan baru
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessId, name, description, durationMinutes, price } =
    await req.json();

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = await prisma.service.create({
    data: { businessId, name, description, durationMinutes, price: price || 0 },
  });

  return NextResponse.json(service, { status: 201 });
}
```

**API bookings GET — tambahkan ke `src/app/api/bookings/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/bookings?customerId=xxx — riwayat customer
// GET /api/bookings?businessId=xxx&date=2025-06-14 — antrian bisnis
export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");

  if (customerId) {
    // Customer lihat riwayat booking sendiri
    if (customerId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        slot: { include: { business: true, service: true } },
      },
      orderBy: { bookedAt: "desc" },
    });
    return NextResponse.json(bookings);
  }

  if (businessId && date) {
    // Business owner lihat booking masuk per tanggal
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.id },
    });
    if (!business)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const slotDate = new Date(date);
    const nextDate = new Date(slotDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        slot: {
          businessId,
          slotDate: { gte: slotDate, lt: nextDate },
        },
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        slot: { include: { service: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    });
    return NextResponse.json(bookings);
  }

  return NextResponse.json(
    { error: "customerId atau businessId+date wajib diisi" },
    { status: 400 },
  );
}
```

**API booking update — `src/app/api/bookings/[id]/route.ts`:**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// PATCH /api/bookings/[id] — update status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: { include: { business: true } } },
  });

  if (!booking)
    return NextResponse.json(
      { error: "Booking tidak ditemukan" },
      { status: 404 },
    );

  // Customer hanya bisa batalkan booking sendiri
  if (session.role === "CUSTOMER") {
    if (booking.customerId !== session.id || status !== "CANCELLED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Business owner hanya bisa update booking di bisnisnya
  if (session.role === "BUSINESS_OWNER") {
    if (booking.slot.business.ownerId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  // Kalau dibatalkan, buka kembali slot
  if (status === "CANCELLED") {
    await prisma.slot.update({
      where: { id: booking.slotId },
      data: { status: "AVAILABLE" },
    });
  }

  return NextResponse.json(updated);
}
```

**Conflict check — wajib pakai transaction:**

```typescript
// src/app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId, notes } = await req.json();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { _count: { select: { bookings: true } } },
      });

      if (!slot) throw new Error("Slot tidak ditemukan");
      if (slot.status === "BLOCKED") throw new Error("Slot tidak tersedia");
      if (slot._count.bookings >= slot.maxCapacity)
        throw new Error("Slot sudah penuh");

      const existing = await tx.booking.findUnique({
        where: { slotId_customerId: { slotId, customerId: session.id } },
      });
      if (existing) throw new Error("Kamu sudah booking slot ini");

      const newBooking = await tx.booking.create({
        data: { slotId, customerId: session.id, notes },
        include: {
          slot: { include: { business: true, service: true } },
          customer: true,
        },
      });

      const totalBookings = slot._count.bookings + 1;
      if (totalBookings >= slot.maxCapacity) {
        await tx.slot.update({
          where: { id: slotId },
          data: { status: "FULL" },
        });
      }

      return newBooking;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

---

### Minggu 3 — Business dashboard

- [ ] API `POST /api/slots` — buat slot baru (kode sudah ada di minggu 2)
- [ ] API `PATCH /api/slots/[id]` — block / unblock slot (kode sudah ada di minggu 2)
- [ ] API `GET /api/bookings?businessId=&date=` — booking masuk (kode sudah ada di minggu 2)
- [ ] API `PATCH /api/bookings/[id]` — update status (kode sudah ada di minggu 2)
- [ ] API `POST /api/slots/generate` — generate slot otomatis sehari penuh
- [ ] Halaman `/dashboard` — stat harian + antrian hari ini
- [ ] Halaman `/dashboard/slots` — kalender slot + block/unblock
- [ ] Komponen: `BookingTable`, `SlotManager`, `StatCard`

**API generate slot otomatis — `src/app/api/slots/generate/route.ts`:**

Fitur ini sangat berguna buat bisnis yang mau buat slot sehari penuh sekaligus,
tanpa harus input satu per satu.

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// POST /api/slots/generate
// Body: { businessId, serviceId, date, openTime, closeTime, intervalMinutes }
// Contoh: { openTime: "09:00", closeTime: "17:00", intervalMinutes: 30 }
// → generate slot 09:00, 09:30, 10:00, ... sampai 16:30
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    businessId,
    serviceId,
    date,
    openTime,
    closeTime,
    intervalMinutes = 30,
  } = await req.json();

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Parse jam buka dan tutup
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Generate semua slot dari jam buka ke jam tutup
  const slotsToCreate = [];
  for (
    let start = openMinutes;
    start + intervalMinutes <= closeMinutes;
    start += intervalMinutes
  ) {
    const startH = Math.floor(start / 60);
    const startM = start % 60;
    const endH = Math.floor((start + intervalMinutes) / 60);
    const endM = (start + intervalMinutes) % 60;

    slotsToCreate.push({
      businessId,
      serviceId,
      slotDate: new Date(date),
      startTime: new Date(0, 0, 0, startH, startM),
      endTime: new Date(0, 0, 0, endH, endM),
      maxCapacity: 1,
    });
  }

  // Insert semua sekaligus dengan createMany
  await prisma.slot.createMany({ data: slotsToCreate });

  return NextResponse.json({ created: slotsToCreate.length }, { status: 201 });
}
```

---

### Minggu 4 — Notifikasi, polish, deploy

- [ ] `src/lib/telegram.ts` sudah dibuat dan terkoneksi ke bot
- [ ] API `POST /api/profile/telegram` — simpan chat_id user
- [ ] API `POST /api/telegram/webhook` — bot balas `/start` dengan chat_id
- [ ] Halaman profil customer ada tombol "Connect Telegram"
- [ ] Email konfirmasi langsung terkirim setelah booking
- [ ] Telegram notif langsung masuk setelah booking (kalau sudah connect)
- [ ] Email + Telegram reminder H-1 via Vercel Cron
- [ ] `vercel.json` sudah ada di root project
- [ ] Loading state di semua form dan tombol submit
- [ ] Error message yang jelas di semua endpoint dan form
- [ ] Mobile responsive semua halaman
- [ ] `npm run build` sukses tanpa TypeScript error
- [ ] Deploy ke Vercel (lihat bagian 12)

---

## 10. Setup notifikasi — Email + Telegram + Vercel Cron

### Update `POST /api/bookings` — kirim ke email + Telegram sekaligus

```typescript
// src/app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { sendBookingConfirmationEmail } from "@/src/lib/mailer";
import { sendBookingConfirmationTelegram } from "@/src/lib/telegram";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId, notes } = await req.json();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { _count: { select: { bookings: true } } },
      });

      if (!slot) throw new Error("Slot tidak ditemukan");
      if (slot.status === "BLOCKED") throw new Error("Slot tidak tersedia");
      if (slot._count.bookings >= slot.maxCapacity)
        throw new Error("Slot sudah penuh");

      const existing = await tx.booking.findUnique({
        where: { slotId_customerId: { slotId, customerId: session.id } },
      });
      if (existing) throw new Error("Kamu sudah booking slot ini");

      const newBooking = await tx.booking.create({
        data: { slotId, customerId: session.id, notes },
        include: {
          slot: { include: { business: true, service: true } },
          customer: true,
        },
      });

      const totalBookings = slot._count.bookings + 1;
      if (totalBookings >= slot.maxCapacity) {
        await tx.slot.update({
          where: { id: slotId },
          data: { status: "FULL" },
        });
      }

      return newBooking;
    });

    // Siapkan data notifikasi
    const notifData = {
      customerName: booking.customer.name,
      businessName: booking.slot.business.name,
      serviceName: booking.slot.service.name,
      date: booking.slot.slotDate.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: booking.slot.startTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      bookingCode: `JDW-${booking.id.slice(0, 6).toUpperCase()}`,
    };

    // Kirim email konfirmasi (selalu)
    sendBookingConfirmationEmail(booking.customer.email, notifData).catch(
      (err) => console.error("Email gagal:", err),
    );

    // Kirim Telegram (kalau user sudah connect)
    if (booking.customer.telegramChatId) {
      sendBookingConfirmationTelegram(
        booking.customer.telegramChatId,
        notifData,
      ).catch((err) => console.error("Telegram gagal:", err));
    }

    // Log notifikasi
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        userId: session.id,
        channel: booking.customer.telegramChatId ? "ALL" : "EMAIL",
        type: "BOOKING_CONFIRMED",
        status: "QUEUED",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

### Cron job reminder H-1 — `src/app/api/cron/reminder/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendReminderEmail } from "@/src/lib/mailer";
import { sendReminderTelegram } from "@/src/lib/telegram";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      remindedAt: null,
      status: "CONFIRMED",
      slot: { slotDate: { gte: tomorrow, lt: nextDay } },
    },
    include: {
      customer: true,
      slot: { include: { business: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const notifData = {
        customerName: booking.customer.name,
        businessName: booking.slot.business.name,
        date: booking.slot.slotDate.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: booking.slot.startTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Kirim email reminder (selalu)
      await sendReminderEmail(booking.customer.email, notifData);

      // Kirim Telegram reminder (kalau user sudah connect)
      if (booking.customer.telegramChatId) {
        await sendReminderTelegram(booking.customer.telegramChatId, notifData);
      }

      // Tandai sudah di-remind
      await prisma.booking.update({
        where: { id: booking.id },
        data: { remindedAt: new Date() },
      });

      sent++;
    } catch (err) {
      console.error(`Gagal kirim reminder booking ${booking.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: bookings.length });
}
```

### Buat vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/reminder",
      "schedule": "0 2 * * *"
    }
  ]
}
```

> `0 2 * * *` = jam 02:00 UTC = **09:00 WIB**, setiap hari

### Hapus file yang tidak dibutuhkan

```bash
rm -f src/workers/notification.worker.ts
rm -f src/lib/queue.ts
```

---

## 11. Testing

### Test API dengan Thunder Client (VS Code extension)

```
# Register
POST http://localhost:3000/api/auth/register
Body: { "name": "Test", "email": "test@test.com", "password": "password123", "role": "CUSTOMER" }

# Login
POST http://localhost:3000/api/auth/login
Body: { "email": "test@test.com", "password": "password123" }

# Cek session (butuh cookie dari login)
GET http://localhost:3000/api/auth/me

# Logout
POST http://localhost:3000/api/auth/logout

# List bisnis
GET http://localhost:3000/api/businesses

# Slot tersedia
GET http://localhost:3000/api/slots?businessId=[id]&date=2025-06-14

# Buat booking (butuh cookie dari login)
POST http://localhost:3000/api/bookings
Body: { "slotId": "[id]" }
```

### Cek database

```bash
npx prisma studio
# Buka http://localhost:5555
```

### Cek build

```bash
npm run build
# Harus sukses tanpa error TypeScript
```

---

## 12. Deployment — Vercel (semua di sini)

Semua deploy ke Vercel saja — frontend, API Routes, dan Cron Jobs.
Tidak perlu Railway atau platform lain.

### Langkah 1 — Push ke GitHub (wajib sebelum deploy)

```bash
# Pastikan semua kode sudah di-commit
git add .
git commit -m "feat: complete all features before deployment"
git push origin main
```

Cek di GitHub bahwa semua file sudah terupload dan **tidak ada `.env.local`** yang ikut ter-push.

### Langkah 2 — Deploy ke Vercel

```bash
npm install -g vercel
vercel login
vercel          # setup project pertama kali
vercel --prod   # deploy ke production
```

### Langkah 3 — Environment variables di Vercel

Buka **Vercel Dashboard → project jadwalin → Settings → Environment Variables**, tambahkan:

| Key                                 | Value                             |
| ----------------------------------- | --------------------------------- |
| `DATABASE_URL`                      | connection string Supabase        |
| `JWT_SECRET`                        | secret yang sudah dibuat          |
| `JWT_EXPIRES_IN`                    | `7d`                              |
| `GMAIL_USER`                        | email Gmail kamu                  |
| `GMAIL_APP_PASSWORD`                | 16 karakter app password          |
| `TELEGRAM_BOT_TOKEN`                | token dari BotFather              |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | username bot tanpa @              |
| `CLOUDINARY_CLOUD_NAME`             | dari Cloudinary dashboard         |
| `CLOUDINARY_API_KEY`                | dari Cloudinary dashboard         |
| `CLOUDINARY_API_SECRET`             | dari Cloudinary dashboard         |
| `NEXT_PUBLIC_APP_URL`               | `https://jadwalin.vercel.app`     |
| `CRON_SECRET`                       | random string untuk keamanan cron |

Setelah semua env vars ditambahkan, redeploy:

```bash
vercel --prod
```

### Langkah 4 — Daftarkan Telegram Webhook

Setelah deploy ke Vercel, jalankan perintah ini sekali untuk menghubungkan
bot ke endpoint webhook kamu:

```bash
curl -X POST "https://api.telegram.org/bot[BOT_TOKEN]/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://jadwalin.vercel.app/api/telegram/webhook"}'
```

Ganti `[BOT_TOKEN]` dengan token dari BotFather. Kalau berhasil:

```json
{ "ok": true, "result": true, "description": "Webhook was set" }
```

### Langkah 5 — Verifikasi Cron Job aktif

1. Buka Vercel Dashboard → project jadwalin
2. Pergi ke tab **Cron Jobs**
3. Pastikan `/api/cron/reminder` muncul dengan jadwal `0 2 * * *`
4. Klik **Trigger** untuk test manual apakah cron berjalan

### Langkah 6 — Verifikasi deployment

Setelah semua deploy, test satu per satu di URL production:

```
1. Buka https://jadwalin.vercel.app
2. Register akun baru
3. Login
4. Buka profil → connect Telegram → test bot
5. Browse bisnis dan coba booking slot
6. Cek inbox email — konfirmasi harus masuk dalam 1-2 menit
7. Cek Telegram — notif konfirmasi harus muncul bersamaan
8. Login sebagai business owner → cek dashboard
```

---

## 13. Checklist final

### Fungsionalitas

- [ ] Register sebagai customer berhasil
- [ ] Register sebagai business owner berhasil
- [ ] Login berhasil dan token tersimpan di cookie
- [ ] Logout berhasil dan cookie terhapus
- [ ] Halaman protected redirect ke login kalau belum login
- [ ] Customer bisa browse dan filter bisnis
- [ ] Customer bisa pilih tanggal dan slot tersedia
- [ ] Slot penuh tidak bisa dipilih
- [ ] Booking tersimpan di database
- [ ] Double booking dicegah oleh conflict check
- [ ] Email konfirmasi langsung terkirim setelah booking
- [ ] Telegram notif langsung masuk setelah booking (kalau sudah connect)
- [ ] Business owner bisa lihat booking masuk
- [ ] Business owner bisa buat dan block slot
- [ ] Customer bisa connect Telegram di halaman profil
- [ ] Telegram bot balas dengan chat_id saat user ketik /start
- [ ] Email reminder H-1 terkirim via Vercel Cron
- [ ] Telegram reminder H-1 terkirim bersamaan dengan email

### Kualitas kode

- [ ] `npm run build` sukses tanpa error TypeScript
- [ ] Semua API endpoint punya error handling
- [ ] Loading state ada di semua tombol submit
- [ ] `.env.local` tidak ikut ter-commit ke GitHub
- [ ] JWT_SECRET tidak hardcoded di kode

### Deployment

- [ ] Repo GitHub sudah dibuat dan kode sudah di-push
- [ ] `.env.local` tidak ikut ter-push ke GitHub (cek di repo)
- [ ] App live di Vercel dan bisa diakses
- [ ] Semua env vars sudah diset di Vercel dashboard (termasuk `TELEGRAM_BOT_TOKEN`)
- [ ] Telegram webhook sudah didaftarkan via `curl setWebhook`
- [ ] Test bot Telegram — ketik `/start` → dapat chat_id
- [ ] Cron Job `/api/cron/reminder` muncul di tab Cron Jobs Vercel
- [ ] Test cron manual dari Vercel dashboard — tidak error
- [ ] `vercel.json` sudah ada di root project
- [ ] Test semua fitur di URL production (bukan localhost)
- [ ] App bisa dibuka di mobile (cek responsive)

---

## Ringkasan perintah yang sering dipakai

```bash
# Development
npm run dev                        # jalankan dev server
npx prisma studio                  # lihat database di browser
npx prisma migrate dev --name xxx  # buat migrasi baru
npx prisma generate                # regenerate Prisma Client setelah ubah schema
npx prisma db seed                 # isi data awal
npm run build                      # build production (wajib cek sebelum deploy)

# Git
git add .                          # staging semua perubahan
git commit -m "feat: ..."          # commit dengan pesan
git push origin main               # push ke GitHub

# Deploy
vercel --prod                      # deploy ke Vercel production
```

---

_Jadwalin · Booking & Scheduling Platform_
_Stack: Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · JWT · Nodemailer · Telegram Bot · Tailwind CSS_
_Deploy: Vercel (frontend + API + Cron Jobs)_
