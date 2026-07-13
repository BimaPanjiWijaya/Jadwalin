import { getSession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/src/components/StatCard";
import BookingStatusBadge from "@/src/components/BookingStatusBadge";
