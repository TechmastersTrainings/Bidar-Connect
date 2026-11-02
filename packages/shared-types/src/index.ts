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

// ---------------------------------------------------------------------------
// Phase 7: Driver Portal Contracts
// ---------------------------------------------------------------------------
export type DriverKYCStatus = "UNREGISTERED" | "PENDING" | "VERIFIED" | "REJECTED";
export type RideLifecycleStatus = "SCHEDULED" | "EN_ROUTE" | "TRIP_STARTED" | "ARRIVED" | "COMPLETED" | "CANCELLED";

export interface DriverProfileData {
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  licence_number: string | null;
  licence_expiry: string | null;
  total_completed_trips: number;
  average_rating: number;
  payout_bank_account: string | null;
  payout_ifsc: string | null;
  payout_upi_id: string | null;
}

export interface DriverOnboardPayload {
  licence_number: string;
  licence_expiry: string;
  licence_document_id?: string;
}

export interface PayoutSettingsPayload {
  payout_upi_id?: string;
  payout_bank_account?: string;
  payout_ifsc?: string;
}

export interface VehicleRegisterPayload {
  make: string;
  model: string;
  registration_number: string;
  color: string;
  year: number;
  fuel_type: "PETROL" | "DIESEL" | "CNG" | "EV";
  passenger_capacity: number;
}

export interface VehicleData extends VehicleSummary {
  year: number;
  passenger_capacity: number;
  is_active: boolean;
  is_verified: boolean;
  rc_expiry?: string;
  insurance_expiry?: string;
}

export interface PassengerManifestItem {
  booking_id: string;
  reference_code: string;
  passenger_name: string;
  passenger_phone: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  fare_amount: number;
  booking_status: BookingStatus;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  } | null;
}

export interface RideManifestData {
  ride_id: string;
  status: RideLifecycleStatus;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  total_offered_seats: number;
  available_seats: number;
  booked_seats: number;
  fare_per_seat: number;
  manifest: PassengerManifestItem[];
}

export interface DriverRideData {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  total_offered_seats: number;
  fare_per_seat: number;
  status: RideLifecycleStatus;
  vehicle: VehicleSummary;
  notes: string | null;
  total_confirmed_passengers: number;
  estimated_gross_earnings: number;
}

export interface DriverEarningsSummary {
  total_completed_trips: number;
  total_gross_earnings: number;
  total_platform_commission: number;
  total_net_payout: number;
  pending_payout_amount: number;
  recent_payouts: Array<{
    payout_id: string;
    ride_id: string;
    gross_amount: number;
    commission_deducted: number;
    net_amount: number;
    status: string;
    paid_at: string | null;
  }>;
}



