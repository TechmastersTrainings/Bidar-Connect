import { OfflineTicket } from "../types";

const OFFLINE_TICKETS_KEY = "bidar_mobile_offline_tickets";
const OFFLINE_CONTACTS_KEY = "bidar_mobile_emergency_contacts";

// In-memory fallback if AsyncStorage or localStorage is unavailable
const memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch {
    // Fallback to memoryStore
  }
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback to memoryStore
  }
  memoryStore[key] = value;
}

export const offlineStorage = {
  // Save an authenticated digital ticket pass into the offline vault
  saveTicket(ticket: OfflineTicket): void {
    const existing = this.getTickets();
    const filtered = existing.filter((t) => t.booking_id !== ticket.booking_id);
    filtered.unshift(ticket);
    setStorageItem(OFFLINE_TICKETS_KEY, JSON.stringify(filtered));
  },

  // Retrieve all cached offline tickets
  getTickets(): OfflineTicket[] {
    const raw = getStorageItem(OFFLINE_TICKETS_KEY);
    if (!raw) {
      // Seed default baseline offline ticket for demonstration
      const baseline: OfflineTicket = {
        booking_id: "BK_OFFLINE_20261105_01",
        passenger_id: "usr_pass_demo",
        passenger_name: "Shiva Bhalke",
        passenger_phone: "+919101897219",
        ride_id: "ride_b2h_001",
        origin_city: "Bidar",
        destination_city: "Hyderabad",
        pickup_point: "New Bus Stand (Udgir Road)",
        drop_point: "Gachibowli DLF Hub",
        departure_time: "2026-11-05T07:30:00+05:30",
        seat_count: 1,
        total_fare: 310.0,
        vehicle_registration: "KA 38 M 4120",
        vehicle_model: "Maruti Suzuki Ertiga (Grey)",
        driver_name: "Prakash Biradar",
        driver_phone: "+919550856204",
        signature: "hmac_sha256_verified_offline_pass_token_999",
        issued_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      };
      return [baseline];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Retrieve a specific ticket by booking ID
  getTicket(bookingId: string): OfflineTicket | null {
    const tickets = this.getTickets();
    return tickets.find((t) => t.booking_id === bookingId) || null;
  },

  // Remove ticket (e.g. upon cancellation)
  removeTicket(bookingId: string): void {
    const existing = this.getTickets();
    const updated = existing.filter((t) => t.booking_id !== bookingId);
    setStorageItem(OFFLINE_TICKETS_KEY, JSON.stringify(updated));
  },

  // Emergency contacts vault
  saveEmergencyContacts(contacts: Array<{ name: string; phone: string; relation: string }>): void {
    setStorageItem(OFFLINE_CONTACTS_KEY, JSON.stringify(contacts));
  },

  getEmergencyContacts(): Array<{ name: string; phone: string; relation: string }> {
    const raw = getStorageItem(OFFLINE_CONTACTS_KEY);
    if (!raw) {
      return [
        { name: "Family Primary Contact", phone: "+91 98450 12345", relation: "Spouse / Parent" },
        { name: "NH 65 Highway Patrol", phone: "+91 8482 112 112", relation: "Emergency Helpline" },
      ];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
};

