export type AppMode = "PASSENGER" | "DRIVER";

export interface MobileUser {
  user_id: string;
  phone: string;
  full_name: string;
  email?: string | null;
  is_driver: boolean;
  is_passenger: boolean;
  is_admin: boolean;
  driver_verified: boolean;
}

export interface OfflineTicket {
  booking_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  ride_id: string;
  origin_city: string;
  destination_city: string;
  pickup_point: string;
  drop_point: string;
  departure_time: string;
  seat_count: number;
  total_fare: number;
  vehicle_registration: string;
  vehicle_model: string;
  driver_name: string;
  driver_phone: string;
  signature: string;
  issued_at: string;
  valid_until: string;
}

export interface MobileRide {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  fare_per_seat: number;
  driver: {
    driver_id?: string;
    name: string;
    rating: number;
    total_completed_trips: number;
    avatar_url?: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    registration_number: string;
    fuel_type: string;
  };
  notes?: string | null;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export interface ManifestPassenger {
  booking_id: string;
  passenger_name: string;
  passenger_phone: string;
  seats: number;
  pickup_point: string;
  drop_point: string;
  status: "CONFIRMED" | "PICKED_UP" | "COMPLETED" | "CANCELLED";
}

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  channel: "PUSH" | "SMS" | "WHATSAPP" | "IN_APP";
  timestamp: string;
  read: boolean;
  event_type: string;
}

export interface PayoutRecord {
  payout_id: string;
  ride_id: string;
  amount: number;
  status: "SETTLED" | "PROCESSING" | "QUEUED" | "PENDING_ELIGIBILITY";
  utr_reference?: string;
  created_at: string;
  settled_at?: string;
}

