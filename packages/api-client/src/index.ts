// =============================================================================
// BIDAR CONNECT — Type-Safe API Client
// =============================================================================
// Centralised HTTP client for all frontend & mobile applications.
// Communicates with FastAPI backend at /api/v1/.
// =============================================================================

import type {
  ApiResponse,
  Ride,
  Booking,
  RoutePrice,
  CommissionRule,
  RideSearchParams,
  BookingInitiatePayload,
} from "@bidar-connect/shared-types";

const DEFAULT_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.API_URL ?? "http://localhost:8000");

class BidarConnectAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const opts: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      const code = json.error?.code ?? "UNKNOWN_ERROR";
      const msg = json.error?.message ?? "An unexpected error occurred.";
      throw new ApiError(code, msg, res.status, json.error?.field ?? null);
    }

    return json;
  }

  // --- Health ---
  async health() {
    return this.request<Record<string, unknown>>("GET", "/health");
  }

  // --- Pricing (Admin-controlled, read-only) ---
  async getRoutePricing() {
    return this.request<RoutePrice[]>("GET", "/pricing/routes");
  }

  async getActiveCommissionRule() {
    return this.request<CommissionRule>("GET", "/pricing/commission-rules/active");
  }

  // --- Rides ---
  async searchRides(params: RideSearchParams) {
    const qs = new URLSearchParams();
    qs.set("origin_city", params.origin_city);
    qs.set("destination_city", params.destination_city);
    if (params.seats) qs.set("seats", String(params.seats));
    return this.request<Ride[]>("GET", `/rides/search?${qs.toString()}`);
  }

  // --- Bookings ---
  async initiateBooking(payload: BookingInitiatePayload, idempotencyKey?: string) {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return this.request<Booking>("POST", "/bookings/initiate", payload, headers);
  }

  async getBooking(bookingId: string) {
    return this.request<Booking>("GET", `/bookings/${bookingId}`);
  }
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  field: string | null;

  constructor(code: string, message: string, statusCode: number, field: string | null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
  }
}

// Singleton default client
export const api = new BidarConnectAPI();

// Factory for custom base URLs
export function createApiClient(baseUrl: string) {
  return new BidarConnectAPI(baseUrl);
}

export type { BidarConnectAPI };

