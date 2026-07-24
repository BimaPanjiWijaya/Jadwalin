import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendReminderEmail } from "@/src/lib/mailer";
import { sendReminderTelegram } from "@/src/lib/telegram";
