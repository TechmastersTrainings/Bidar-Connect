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

// ---------------------------------------------------------------------------
// Phase 8: Ride Search & Booking Engine Contracts
// ---------------------------------------------------------------------------
export type TimeWindow = "ALL" | "MORNING" | "AFTERNOON" | "EVENING";
export type SortByOption = "DEPARTURE_ASC" | "RATING_DESC" | "PRICE_ASC";

export interface ExtendedRideSearchParams {
  origin_city: string;
  destination_city: string;
  travel_date?: string;
  seats?: number;
  time_window?: TimeWindow;
  fuel_type?: string;
  pickup_point?: string;
  drop_point?: string;
  sort_by?: SortByOption;
}

export interface HoldSeatPayload {
  ride_id: string;
  requested_seats: number;
  pickup_point: string;
  drop_point: string;
  passenger_name: string;
  passenger_phone: string;
}

export interface HoldSeatResponse {
  hold_id: string;
  ride_id: string;
  seats_held: number;
  fare_per_seat: number;
  total_fare: number;
  reserved_until: string;
  seconds_remaining: number;
  route_summary: {
    origin: string;
    destination: string;
    departure_time: string;
    pickup_point: string;
    drop_point: string;
  };
}

export interface CancellationQuoteResponse {
  booking_id: string;
  reference_code: string;
  total_fare_paid: number;
  hours_until_departure: number;
  refund_percentage: number;
  refund_amount: number;
  deduction_amount: number;
  cancellation_tier: "FULL_REFUND" | "PARTIAL_REFUND" | "NO_REFUND";
  explanation: string;
}

// ---------------------------------------------------------------------------
// Phase 9: Admin Portal Contracts
// ---------------------------------------------------------------------------
export interface AdminMetricsData {
  gross_booking_value: number;
  net_platform_commission: number;
  active_published_rides: number;
  confirmed_passenger_seats: number;
  total_registered_users: number;
  verified_drivers_count: number;
  pending_kyc_approvals: number;
  suspended_accounts_count: number;
}

export interface AdminUserItem {
  user_id: string;
  phone: string;
  email: string | null;
  full_name: string;
  roles: UserRole[];
  is_driver: boolean;
  is_passenger: boolean;
  is_admin: boolean;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  driver_kyc_status?: DriverKYCStatus;
}

export interface SuspendUserPayload {
  reason: string;
}

export interface DriverKYCQueueItem {
  driver_id: string;
  user_id: string;
  driver_name: string;
  phone: string;
  licence_number: string;
  licence_expiry: string;
  licence_document_id: string;
  is_verified: boolean;
  total_completed_trips: number;
  average_rating: number;
  submitted_at: string;
  vehicles_count: number;
}

export interface ReviewKYCPayload {
  action: "APPROVE" | "REJECT";
  feedback_reason?: string;
}

export interface UpdateRoutePricePayload {
  fare_per_seat: number;
  pickup_points?: string[];
  drop_points?: string[];
}

export interface UpdateCommissionPayload {
  fixed_fee_per_seat: number;
  description?: string;
}

export interface AuditLogItem {
  log_id: string;
  action: string;
  actor_name: string;
  target_entity: string;
  target_id: string;
  details: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Phase 10: Payment, Commission & Payout Contracts
// ---------------------------------------------------------------------------
export type PaymentStatus = "INITIATED" | "CAPTURED" | "FAILED" | "REFUNDED";
export type PayoutStatus = "PENDING_ELIGIBILITY" | "QUEUED" | "PROCESSING" | "SETTLED" | "FAILED";
export type LedgerAccountType =
  | "PASSENGER_PAYABLE"
  | "DRIVER_ESCROW_PAYABLE"
  | "COMPANY_COMMISSION_REVENUE"
  | "DRIVER_BANK_DISBURSEMENT"
  | "PAYMENT_GATEWAY_FEES";

export interface CreatePaymentOrderPayload {
  booking_id: string;
  payment_method?: "UPI" | "CARD" | "NETBANKING";
}

export interface PaymentOrderResponse {
  order_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  key_id: string;
  status: PaymentStatus;
  notes?: Record<string, string>;
}

export interface VerifyPaymentPayload {
  booking_id: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  gateway_signature: string;
}

export interface PaymentReceiptData {
  payment_id: string;
  booking_id: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  captured_at: string;
  reference_code: string;
  breakdown: {
    fare_per_seat: number;
    seats_booked: number;
    subtotal: number;
    company_commission: number;
    driver_payable: number;
  };
}

export interface DisbursePayoutPayload {
  ride_id: string;
  force_override_buffer?: boolean;
}

export interface DriverPayoutData {
  payout_id: string;
  ride_id: string;
  driver_id: string;
  gross_amount: number;
  commission_deducted: number;
  net_payable: number;
  status: PayoutStatus;
  payout_reference_utr: string | null;
  settled_at: string | null;
  payout_method: string;
  destination: string;
  created_at: string;
}

export interface LedgerEntryData {
  id: string;
  transaction_code: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: string;
  booking_id?: string | null;
  payout_id?: string | null;
  recorded_at: string;
  notes?: string | null;
}

export interface FinancialSummaryData {
  total_collected_escrow: number;
  total_disbursed_drivers: number;
  total_company_revenue: number;
  pending_driver_escrow: number;
  total_ledger_transactions: number;
}

// ---------------------------------------------------------------------------
// Phase 11: Notifications & External Integrations Contracts
// ---------------------------------------------------------------------------
export type NotificationChannel = "SMS" | "WHATSAPP" | "PUSH" | "EMAIL";

export type NotificationEventType =
  | "OTP_DISPATCH"
  | "BOOKING_CONFIRMED"
  | "SEAT_HELD_REMINDER"
  | "TRIP_STARTED"
  | "DRIVER_ARRIVED"
  | "TRIP_COMPLETED"
  | "TRIP_CANCELLED"
  | "PAYOUT_DISBURSED"
  | "EMERGENCY_SOS_TRIGGERED"
  | "CORRIDOR_ADVISORY";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  trip_reminders: boolean;
  marketing_updates: boolean;
}

export interface SOSTriggerPayload {
  booking_id?: string;
  ride_id?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  details?: string;
}

export interface SOSAlertData {
  alert_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  ride_id?: string | null;
  driver_name?: string | null;
  vehicle_number?: string | null;
  location: {
    latitude?: number;
    longitude?: number;
    landmark?: string;
  };
  status: "ACTIVE_EMERGENCY" | "ACKNOWLEDGED" | "RESOLVED";
  dispatched_contacts_count: number;
  triggered_at: string;
  emergency_notes?: string;
}

export interface DispatchLogItem {
  dispatch_id: string;
  channel: NotificationChannel;
  recipient: string;
  event_type: string;
  status: "DELIVERED" | "SENT" | "FAILED";
  provider: string;
  content_snippet: string;
  dispatched_at: string;
}

export interface BroadcastAdvisoryPayload {
  title: string;
  message: string;
  channels: NotificationChannel[];
  target_audience: "ALL" | "PASSENGERS" | "DRIVERS";
}

// ---------------------------------------------------------------------------
// Phase 13: Mobile Applications Contracts (React Native / Expo)
// ---------------------------------------------------------------------------

export type MobileAppMode = "PASSENGER" | "DRIVER";

export interface MobileDeviceRegistrationPayload {
  device_id: string;
  fcm_token: string;
  platform: "ios" | "android" | "web";
  app_version: string;
  device_model?: string;
  os_version?: string;
}

export interface OfflineTicketPayload {
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

export interface DriverTelemetryPayload {
  ride_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading?: number;
  recorded_at: string;
}

export interface MobileAppConfig {
  min_version: string;
  latest_version: string;
  force_update: boolean;
  emergency_helpline: string;
  standard_fare: number;
  corridor_name: string;
  offline_cache_ttl_hours: number;
  support_email: string;
}


