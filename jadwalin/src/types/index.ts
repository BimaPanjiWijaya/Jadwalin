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

export interface BookingWithDetails {
  id: string;
  bookingCode: string;
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

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
