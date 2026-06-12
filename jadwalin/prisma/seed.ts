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
