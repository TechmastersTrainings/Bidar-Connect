// =============================================================================
// BIDAR CONNECT — Shared TypeScript Contracts
// =============================================================================
// Single source of truth for all data structures shared across
// public-web, passenger-web, driver-web, admin-web, and mobile apps.
// =============================================================================

// ---------------------------------------------------------------------------
// API Response Envelope (matches FastAPI ApiResponse schema)
// ---------------------------------------------------------------------------
export interface ErrorDetail {
  code: string;
  message: string;
  field?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ResponseMetadata {
  timestamp: string;
  request_id?: string | null;
  page?: number | null;
  page_size?: number | null;
  total_count?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorDetail | null;
  metadata: ResponseMetadata;
}

// ---------------------------------------------------------------------------
// Driver & Vehicle
// ---------------------------------------------------------------------------
export interface DriverSummary {
  driver_id: string;
  name: string;
  rating: number;
  total_completed_trips: number;
  avatar_url: string | null;
}

export interface VehicleSummary {
  vehicle_id: string;
  make: string;
  model: string;
  color: string;
  registration_number: string;
  fuel_type: "PETROL" | "DIESEL" | "CNG" | "EV";
}

// ---------------------------------------------------------------------------
// Route & Pricing (Admin-controlled, read-only for drivers & passengers)
// ---------------------------------------------------------------------------
export interface RoutePrice {
  route_id: string;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  fare_per_seat: number;
  currency: string;
  pickup_points: string[];
  drop_points: string[];
  is_active: boolean;
}

export interface CommissionRule {
  rule_id: string;
  rule_type: "FIXED_PER_SEAT" | "PERCENTAGE" | "TIERED";
  fixed_fee_per_seat: number;
  effective_from: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Ride (Published by Driver, searched by Passenger)
// ---------------------------------------------------------------------------
export interface Ride {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  fare_per_seat: number;
  driver: DriverSummary;
  vehicle: VehicleSummary;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------
export interface FareSnapshot {
  fare_per_seat: number;
  total_fare: number;
  company_commission: number;
  driver_payable: number;
  commission_rule_id: string;
}

export interface BookingRoute {
  origin_city: string;
  destination_city: string;
  pickup_point: string;
  drop_point: string;
  departure_time: string;
}

export interface PassengerInfo {
  passenger_id: string;
  name: string;
  phone: string;
}

export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type PaymentStatus = "INITIATED" | "CAPTURED" | "RECONCILED" | "REFUNDED" | "FAILED" | "EXPIRED";

export interface Booking {
  booking_id: string;
  reference_code: string;
  ride_id: string;
  passenger: PassengerInfo;
  driver: DriverSummary;
  vehicle: VehicleSummary;
  route: BookingRoute;
  seats_booked: number;
  fare_snapshot: FareSnapshot;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  reserved_until: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API Request Payloads
// ---------------------------------------------------------------------------
export interface RideSearchParams {
  origin_city: string;
  destination_city: string;
  seats?: number;
  travel_date?: string;
}

export interface BookingInitiatePayload {
  ride_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  requested_seats: number;
  pickup_point: string;
  drop_point: string;
}

export interface PublishRidePayload {
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  driver_id: string;
  vehicle_id: string;
  driver_notes?: string;
}

// ---------------------------------------------------------------------------
// Authentication & RBAC Contracts
// ---------------------------------------------------------------------------
export type UserRole = "PASSENGER" | "DRIVER" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  user_id: string;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  is_driver: boolean;
  is_passenger: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  driver_verified: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface RequestOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  full_name?: string;
}


