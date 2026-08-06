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

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

> **Catatan Prisma 7:** Wajib menggunakan `PrismaPg` adapter dari `@prisma/adapter-pg`.
> Tanpa adapter, akan muncul error `PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl"`.

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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });
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
      if (!res.ok) { setError(data.error); return; }
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
            Mulai terima booking<br />dari sekarang
          </h2>
          <p className="text-blue-100 text-lg">
            Daftarkan bisnis atau temukan layanan terbaik di sekitarmu.
          </p>
        </div>
        <p className="text-blue-200 text-sm">© 2025 Jadwalin</p>
      </div>

      {/* Kanan — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Buat akun</h1>
            <p className="text-gray-500 mt-1">Sudah punya akun?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">Masuk</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="kamu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daftar sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "CUSTOMER", label: "Customer", desc: "Cari & booking layanan" },
                  { value: "BUSINESS_OWNER", label: "Business Owner", desc: "Kelola bisnis & terima booking" },
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
                    <p className={`text-sm font-semibold ${form.role === opt.value ? "text-blue-600" : "text-gray-900"}`}>
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
      if (!res.ok) { setError(data.error); return; }
      router.push("/");
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
            Selamat datang<br />kembali!
          </h2>
          <p className="text-blue-100 text-lg">
            Masuk untuk melihat booking dan mengelola jadwal kamu.
          </p>
        </div>
        <p className="text-blue-200 text-sm">© 2025 Jadwalin</p>
      </div>

      {/* Kanan — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Masuk</h1>
            <p className="text-gray-500 mt-1">Belum punya akun?{" "}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">Daftar gratis</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="kamu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
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

## 8b. Komponen UI — `src/components/`

### Struktur folder

```
src/components/
├── Navbar.tsx           ← server component, cek session
├── NavbarMobileMenu.tsx ← client component, hamburger menu mobile
├── LogoutButton.tsx     ← client component, tombol keluar
├── Footer.tsx           ← footer sederhana
├── BusinessCard.tsx     ← card bisnis untuk home page
├── SlotGrid.tsx         ← grid slot tersedia untuk halaman booking
├── BookingSummary.tsx   ← ringkasan booking sebelum konfirmasi
├── StatCard.tsx         ← kartu statistik untuk dashboard
└── BookingStatusBadge.tsx ← badge status booking
```

### Update `src/app/layout.tsx` — pasang Navbar & Footer

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jadwalin — Booking & Scheduling",
  description: "Platform booking layanan terpercaya",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${geist.className} bg-gray-50 min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
```

### `src/components/LogoutButton.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
```

### `src/components/NavbarMobileMenu.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Session = { id: string; role: string; email: string } | null;

export default function NavbarMobileMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-600 hover:text-blue-600"
        aria-label="Menu"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg px-6 py-4 flex flex-col gap-4 z-50">
          <Link href="/" onClick={() => setOpen(false)} className="text-sm text-gray-700 hover:text-blue-600">
            Beranda
          </Link>
          {session?.role === "CUSTOMER" && (
            <Link href="/my-bookings" onClick={() => setOpen(false)} className="text-sm text-gray-700 hover:text-blue-600">
              Booking Saya
            </Link>
          )}
          {session?.role === "BUSINESS_OWNER" && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
          )}
          {session ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className="text-sm text-gray-700 hover:text-blue-600">
                Profil
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-500 text-left">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-sm text-gray-700">
                Masuk
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="text-sm text-blue-600 font-medium">
                Daftar
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### `src/components/Navbar.tsx`

```tsx
import Link from "next/link";
import { getSession } from "@/src/lib/auth";
import LogoutButton from "./LogoutButton";
import NavbarMobileMenu from "./NavbarMobileMenu";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-blue-600 font-bold text-xl tracking-tight">
          Jadwalin
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
            Beranda
          </Link>
          {session?.role === "CUSTOMER" && (
            <Link href="/my-bookings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Booking Saya
            </Link>
          )}
          {session?.role === "BUSINESS_OWNER" && (
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
          )}
          {session ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Profil
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Daftar
              </Link>
            </div>
          )}
        </nav>

        <NavbarMobileMenu session={session} />
      </div>
    </header>
  );
}
```

### `src/components/Footer.tsx`

```tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-blue-600 font-bold text-lg">Jadwalin</span>
          <p className="text-xs text-gray-400 mt-1">
            Platform booking & scheduling terpercaya
          </p>
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Beranda</Link>
          <Link href="/register" className="hover:text-blue-600 transition-colors">Daftar</Link>
          <Link href="/login" className="hover:text-blue-600 transition-colors">Masuk</Link>
        </div>
        <p className="text-xs text-gray-400">© 2025 Jadwalin</p>
      </div>
    </footer>
  );
}
```

### `src/components/BusinessCard.tsx`

```tsx
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

export default function BusinessCard({ slug, name, category, address, logoUrl, services }: Props) {
  return (
    <Link
      href={`/book/${slug}`}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <span className="text-5xl font-bold text-blue-200">{name.charAt(0)}</span>
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
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {address}
          </p>
        )}
        {services.length > 0 && (
          <div className="mt-3 flex gap-1 flex-wrap">
            {services.map((svc) => (
              <span key={svc.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {svc.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
```

### `src/components/StatCard.tsx`

```tsx
type Props = {
  label: string;
  value: number | string;
  color?: string;
};

export default function StatCard({ label, value, color = "text-blue-600" }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
```

### `src/components/BookingStatusBadge.tsx`

```tsx
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
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-600"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
```

---

### Update halaman dengan komponen & tampilan profesional

**`src/app/page.tsx` (Home — pakai BusinessCard):**

```tsx
import { prisma } from "@/src/lib/prisma";
import BusinessCard from "@/src/components/BusinessCard";
import Link from "next/link";

const CATEGORIES = ["Semua", "barbershop", "salon", "klinik", "gym", "fotografer"];

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
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Temukan & Booking Layanan
        </h1>
        <p className="text-gray-500 text-lg">
          Jadwalkan appointment dengan mudah dan cepat
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
```

**`src/app/book/[slug]/page.tsx` (Booking — tampilan profesional):**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Service = { id: string; name: string; durationMinutes: number; price: number };
type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: Service;
  _count: { bookings: number };
  maxCapacity: number;
};
type Business = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  services: Service[];
};

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/businesses/${slug}`)
        .then((r) => r.json())
        .then(setBusiness);
    });
  }, [params]);

  useEffect(() => {
    if (!business) return;
    fetch(`/api/slots?businessId=${business.id}&date=${date}`)
      .then((r) => r.json())
      .then(setSlots);
    setSelectedSlot(null);
  }, [business, date]);

  async function handleBooking() {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot.id, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess("Booking berhasil! Cek email kamu untuk konfirmasi.");
      setTimeout(() => router.push("/my-bookings"), 2000);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat...</div>
      </div>
    );
  }

  const formatTime = (isoTime: string) =>
    new Date(isoTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const formatPrice = (price: number) =>
    price > 0 ? `Rp ${price.toLocaleString("id-ID")}` : "Gratis";

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header bisnis */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        {business.logoUrl && (
          <img src={business.logoUrl} alt={business.name} className="w-full h-48 object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium mt-1 capitalize">
                {business.category}
              </span>
            </div>
          </div>
          {business.description && (
            <p className="text-sm text-gray-500 mt-3">{business.description}</p>
          )}
          {business.address && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {business.address}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
          {/* Pilih tanggal */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Pilih Tanggal</h2>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Grid slot */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Pilih Waktu</h2>
            {slots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Tidak ada slot tersedia untuk tanggal ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isFull = slot._count.bookings >= slot.maxCapacity;
                  const isBlocked = slot.status === "BLOCKED";
                  const isSelected = selectedSlot?.id === slot.id;
                  const unavailable = isFull || isBlocked;
                  return (
                    <button
                      key={slot.id}
                      disabled={unavailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-sm text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : unavailable
                            ? "bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100"
                            : "bg-white hover:border-blue-400 hover:text-blue-600 border-gray-200"
                      }`}
                    >
                      <div className="font-medium">{formatTime(slot.startTime)}</div>
                      <div className="text-xs opacity-70 mt-0.5">{slot.service.name}</div>
                      {isFull && <div className="text-xs mt-0.5 text-red-400">Penuh</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel konfirmasi */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Ringkasan Booking</h2>
            {!selectedSlot ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Pilih tanggal dan waktu terlebih dahulu
              </p>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Layanan</span>
                    <span className="font-medium">{selectedSlot.service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waktu</span>
                    <span className="font-medium">
                      {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-medium">
                      {new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-500">Harga</span>
                    <span className="font-bold text-blue-600">{formatPrice(selectedSlot.service.price)}</span>
                  </div>
                </div>
                <textarea
                  placeholder="Catatan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                {success && <p className="text-green-600 text-xs">{success}</p>}
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Memproses..." : "Konfirmasi Booking"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
```

**`src/app/my-bookings/page.tsx` (Riwayat Booking — pakai BookingStatusBadge):**

```tsx
import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingStatusBadge from "@/src/components/BookingStatusBadge";

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.id },
    include: { slot: { include: { business: true, service: true } } },
    orderBy: { bookedAt: "desc" },
  });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Booking</h1>

      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400 mb-4">Kamu belum punya booking.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Cari Layanan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">{booking.slot.business.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{booking.slot.service.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(booking.slot.slotDate)} · {formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}
                  </p>
                  {booking.bookingCode && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">#{booking.bookingCode}</p>
                  )}
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

**`src/app/dashboard/page.tsx` (Dashboard — pakai StatCard & BookingStatusBadge):**

```tsx
import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/src/components/StatCard";
import BookingStatusBadge from "@/src/components/BookingStatusBadge";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") redirect("/login");

  const business = await prisma.business.findFirst({ where: { ownerId: session.id } });

  if (!business) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Selamat datang!</h1>
          <p className="text-gray-500 mb-6">Kamu belum punya bisnis. Buat sekarang untuk mulai menerima booking.</p>
          <Link href="/dashboard/setup" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Buat Bisnis
          </Link>
        </div>
      </main>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, totalSlots, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { slot: { businessId: business.id, slotDate: { gte: today, lt: tomorrow } }, status: { not: "CANCELLED" } },
      include: { customer: { select: { name: true, email: true } }, slot: { include: { service: true } } },
      orderBy: { slot: { startTime: "asc" } },
    }),
    prisma.slot.count({ where: { businessId: business.id } }),
    prisma.booking.count({ where: { slot: { businessId: business.id }, status: { not: "CANCELLED" } } }),
  ]);

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium capitalize">
            {business.category}
          </span>
        </div>
        <Link
          href="/dashboard/slots"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Kelola Slot
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Booking Hari Ini" value={todayBookings.length} />
        <StatCard label="Total Slot" value={totalSlots} color="text-purple-600" />
        <StatCard label="Total Booking" value={totalBookings} color="text-green-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Antrian Hari Ini</h2>
        </div>
        {todayBookings.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            Tidak ada booking hari ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{booking.customer.name}</p>
                  <p className="text-sm text-gray-500">{booking.slot.service.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

**`src/app/profile/page.tsx` (Profil — tampilan profesional):**

```tsx
"use client";

import React, { useState, useEffect } from "react";

type User = { id: string; name: string; email: string; role: string; telegramChatId: string | null };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setUser);
  }, []);

  async function saveTelegram(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setMessage("Telegram berhasil dihubungkan!");
        setUser((prev) => prev ? { ...prev, telegramChatId: chatId } : prev);
      } else {
        setIsSuccess(false);
        setMessage(data.error);
      }
    } catch {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function disconnectTelegram() {
    setLoading(true);
    await fetch("/api/profile/telegram", { method: "DELETE" });
    setUser((prev) => prev ? { ...prev, telegramChatId: null } : prev);
    setChatId("");
    setIsSuccess(false);
    setMessage("Telegram berhasil diputus.");
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat...</div>
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil</h1>

      {/* Info akun */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium capitalize">
              {user.role === "BUSINESS_OWNER" ? "Business Owner" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
          </svg>
          <h2 className="font-semibold text-gray-900">Notifikasi Telegram</h2>
        </div>

        {user.telegramChatId ? (
          <div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 font-medium">Telegram terhubung</p>
            </div>
            <p className="text-xs text-gray-400 mb-3">Chat ID: <span className="font-mono">{user.telegramChatId}</span></p>
            <button
              onClick={disconnectTelegram}
              disabled={loading}
              className="text-sm text-red-500 hover:text-red-600 underline"
            >
              Putus koneksi
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-gray-600 space-y-1">
              <p>1. Buka{" "}
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium underline"
                >
                  @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
                </a>{" "}
                dan ketik <span className="font-mono">/start</span>
              </p>
              <p>2. Copy Chat ID yang dikirim bot</p>
              <p>3. Paste di bawah ini dan klik Simpan</p>
            </div>
            <form onSubmit={saveTelegram} className="flex gap-2">
              <input
                type="text"
                placeholder="Chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !chatId}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Simpan
              </button>
            </form>
          </div>
        )}

        {message && (
          <p className={`text-sm mt-3 ${isSuccess ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
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

**Halaman Home — `src/app/page.tsx`:**

```tsx
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";

const CATEGORIES = ["Semua", "barbershop", "salon", "klinik", "gym", "fotografer"];

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
    include: {
      services: { where: { isActive: true }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Temukan Layanan</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === "Semua" ? "/" : `/?category=${cat}`}
            className={`px-4 py-1.5 rounded-full border text-sm ${
              category === cat || (!category && cat === "Semua")
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {businesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/book/${biz.slug}`}
            className="border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            {biz.logoUrl && (
              <img
                src={biz.logoUrl}
                alt={biz.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <h2 className="text-lg font-semibold">{biz.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{biz.category}</p>
            {biz.address && (
              <p className="text-sm text-gray-400 mt-1">{biz.address}</p>
            )}
            {biz.services.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {biz.services.map((svc) => (
                  <span
                    key={svc.id}
                    className="text-xs bg-gray-100 px-2 py-0.5 rounded-full"
                  >
                    {svc.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
        {businesses.length === 0 && (
          <p className="text-gray-400 col-span-2">Belum ada bisnis tersedia.</p>
        )}
      </div>
    </main>
  );
}
```

**Halaman Book — `src/app/book/[slug]/page.tsx`:**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: Service;
  _count: { bookings: number };
  maxCapacity: number;
};

type Business = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  services: Service[];
};

export default function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/businesses/${slug}`)
        .then((r) => r.json())
        .then(setBusiness);
    });
  }, [params]);

  useEffect(() => {
    if (!business) return;
    fetch(`/api/slots?businessId=${business.id}&date=${date}`)
      .then((r) => r.json())
      .then(setSlots);
    setSelectedSlot(null);
  }, [business, date]);

  async function handleBooking() {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot.id, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("Booking berhasil! Cek email kamu untuk konfirmasi.");
      setTimeout(() => router.push("/my-bookings"), 2000);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  if (!business) return <div className="p-6">Memuat...</div>;

  const formatTime = (isoTime: string) =>
    new Date(isoTime).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
      <p className="text-gray-500 capitalize mb-6">{business.category}</p>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Pilih Tanggal</label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Slot Tersedia</h2>
        {slots.length === 0 ? (
          <p className="text-gray-400">Tidak ada slot tersedia untuk tanggal ini.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const isFull = slot._count.bookings >= slot.maxCapacity;
              const isBlocked = slot.status === "BLOCKED";
              const isSelected = selectedSlot?.id === slot.id;
              const unavailable = isFull || isBlocked;
              return (
                <button
                  key={slot.id}
                  disabled={unavailable}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded-lg border text-sm text-center transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : unavailable
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "hover:border-blue-400 border-gray-300"
                  }`}
                >
                  {formatTime(slot.startTime)}
                  <div className="text-xs opacity-70">{slot.service.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="border rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Konfirmasi Booking</h3>
          <div className="text-sm text-gray-600 mb-3 space-y-1">
            <p>
              Layanan: <strong>{selectedSlot.service.name}</strong>
            </p>
            <p>
              Waktu:{" "}
              <strong>
                {formatTime(selectedSlot.startTime)} –{" "}
                {formatTime(selectedSlot.endTime)}
              </strong>
            </p>
            <p>
              Tanggal:{" "}
              <strong>
                {new Date(date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
            </p>
          </div>
          <textarea
            placeholder="Catatan (opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mb-3"
            rows={2}
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-2">{success}</p>}
          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi Booking"}
          </button>
        </div>
      )}
    </main>
  );
}
```

**Halaman My Bookings — `src/app/my-bookings/page.tsx`:**

```tsx
import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DONE: "bg-gray-100 text-gray-800",
};

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.id },
    include: {
      slot: { include: { business: true, service: true } },
    },
    orderBy: { bookedAt: "desc" },
  });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Riwayat Booking</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Belum ada booking.</p>
          <Link href="/" className="text-blue-600 underline">
            Temukan layanan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-semibold">{booking.slot.business.name}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[booking.status] ?? ""}`}
                >
                  {booking.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{booking.slot.service.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(booking.slot.slotDate)} ·{" "}
                {formatTime(booking.slot.startTime)} –{" "}
                {formatTime(booking.slot.endTime)}
              </p>
              {booking.bookingCode && (
                <p className="text-xs text-gray-400 mt-1">
                  Kode: {booking.bookingCode}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
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

**Halaman Dashboard — `src/app/dashboard/page.tsx`:**

```tsx
import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "BUSINESS_OWNER") redirect("/login");

  const business = await prisma.business.findFirst({
    where: { ownerId: session.id },
  });

  if (!business) {
    return (
      <main className="min-h-screen p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-500 mb-4">Kamu belum punya bisnis.</p>
        <Link
          href="/dashboard/setup"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Buat Bisnis Sekarang
        </Link>
      </main>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, totalSlots, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        slot: {
          businessId: business.id,
          slotDate: { gte: today, lt: tomorrow },
        },
        status: { not: "CANCELLED" },
      },
      include: {
        customer: { select: { name: true, email: true } },
        slot: { include: { service: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    }),
    prisma.slot.count({ where: { businessId: business.id } }),
    prisma.booking.count({
      where: {
        slot: { businessId: business.id },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
      <p className="text-gray-500 mb-6 capitalize">{business.category}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {todayBookings.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Booking Hari Ini</p>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalSlots}</p>
          <p className="text-sm text-gray-500 mt-1">Total Slot</p>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
          <p className="text-sm text-gray-500 mt-1">Total Booking</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Antrian Hari Ini</h2>
        <Link href="/dashboard/slots" className="text-blue-600 text-sm underline">
          Kelola Slot →
        </Link>
      </div>

      {todayBookings.length === 0 ? (
        <p className="text-gray-400">Tidak ada booking hari ini.</p>
      ) : (
        <div className="space-y-3">
          {todayBookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{booking.customer.name}</p>
                <p className="text-sm text-gray-500">
                  {booking.slot.service.name}
                </p>
                <p className="text-sm text-gray-400">
                  {formatTime(booking.slot.startTime)} –{" "}
                  {formatTime(booking.slot.endTime)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  booking.status === "CONFIRMED"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {booking.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

**Halaman Dashboard Slots — `src/app/dashboard/slots/page.tsx`:**

```tsx
"use client";

import React, { useState, useEffect } from "react";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: { id: string; name: string };
  _count: { bookings: number };
  maxCapacity: number;
};

type Business = {
  id: string;
  name: string;
  services: { id: string; name: string }[];
};

export default function DashboardSlotsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((data: Business[]) => {
        if (data.length > 0) setBusiness(data[0]);
      });
  }, []);

  useEffect(() => {
    if (!business) return;
    fetchSlots();
  }, [business, date]);

  async function fetchSlots() {
    if (!business) return;
    const res = await fetch(
      `/api/slots?businessId=${business.id}&date=${date}`,
    );
    const data = await res.json();
    setSlots(data);
  }

  async function toggleBlock(slot: Slot) {
    const newStatus = slot.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
    await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchSlots();
  }

  async function handleGenerate(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!business) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/slots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        serviceId: fd.get("serviceId"),
        date,
        openTime: fd.get("openTime"),
        closeTime: fd.get("closeTime"),
        intervalMinutes: Number(fd.get("interval")),
      }),
    });
    setLoading(false);
    fetchSlots();
  }

  const formatTime = (isoTime: string) =>
    new Date(isoTime).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Kelola Slot</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <form onSubmit={handleGenerate} className="border rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Generate Slot Otomatis</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm">Layanan</label>
            <select
              name="serviceId"
              className="w-full border rounded px-2 py-1.5 mt-0.5 text-sm"
              required
            >
              {business?.services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Interval (menit)</label>
            <input
              name="interval"
              type="number"
              defaultValue="30"
              min="15"
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>
          <div>
            <label className="text-sm">Jam Buka</label>
            <input
              name="openTime"
              type="time"
              defaultValue="09:00"
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>
          <div>
            <label className="text-sm">Jam Tutup</label>
            <input
              name="closeTime"
              type="time"
              defaultValue="17:00"
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm"
        >
          {loading ? "Membuat..." : "Generate Slot"}
        </button>
      </form>

      <h2 className="font-semibold mb-3">Slot pada {date}</h2>
      {slots.length === 0 ? (
        <p className="text-gray-400">Belum ada slot untuk tanggal ini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`border rounded-lg p-3 ${
                slot.status === "BLOCKED" ? "bg-gray-100 opacity-60" : ""
              }`}
            >
              <p className="font-medium text-sm">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </p>
              <p className="text-xs text-gray-500">{slot.service.name}</p>
              <p className="text-xs text-gray-400 mb-2">
                {slot._count.bookings}/{slot.maxCapacity} booking
              </p>
              <button
                onClick={() => toggleBlock(slot)}
                className={`text-xs px-2 py-1 rounded ${
                  slot.status === "BLOCKED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {slot.status === "BLOCKED" ? "Unblock" : "Block"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
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

**Halaman Profil — `src/app/profile/page.tsx`:**

```tsx
"use client";

import React, { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  telegramChatId: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser);
  }, []);

  async function saveTelegram(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Telegram berhasil dihubungkan!");
        setUser((prev) =>
          prev ? { ...prev, telegramChatId: chatId } : prev,
        );
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function disconnectTelegram() {
    setLoading(true);
    await fetch("/api/profile/telegram", { method: "DELETE" });
    setUser((prev) => (prev ? { ...prev, telegramChatId: null } : prev));
    setChatId("");
    setMessage("Telegram berhasil diputus.");
    setLoading(false);
  }

  if (!user) return <div className="p-6">Memuat...</div>;

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <div className="border rounded-xl p-4 mb-6">
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      <div className="border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Notifikasi Telegram</h2>

        {user.telegramChatId ? (
          <div>
            <p className="text-sm text-green-600 mb-3">
              ✓ Telegram sudah terhubung (Chat ID: {user.telegramChatId})
            </p>
            <button
              onClick={disconnectTelegram}
              disabled={loading}
              className="text-sm text-red-600 underline"
            >
              Putus koneksi Telegram
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              1. Buka{" "}
              <a
                href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
              </a>{" "}
              di Telegram dan ketik /start
              <br />
              2. Copy Chat ID yang dikirim bot
              <br />
              3. Paste di bawah dan simpan
            </p>
            <form onSubmit={saveTelegram} className="flex gap-2">
              <input
                type="text"
                placeholder="Chat ID dari bot"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !chatId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Simpan
              </button>
            </form>
          </div>
        )}

        {message && <p className="text-sm mt-2 text-gray-600">{message}</p>}
      </div>
    </main>
  );
}
```

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
