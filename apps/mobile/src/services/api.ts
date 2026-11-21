import { MobileRide, ManifestPassenger, MobileNotification, PayoutRecord, OfflineTicket } from "../types";

// Base API configuration with environment fallback
export const API_BASE = "http://127.0.0.1:8000/api/v1";

class MobileApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Platform": "mobile-native",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // 1. Mobile Config
  async getConfig() {
    try {
      const res = await fetch(`${API_BASE}/mobile/config`);
      const json = await res.json();
      return json.data;
    } catch {
      return {
        standard_fare: 310,
        emergency_helpline: "+91 8482 112 112",
        min_version: "1.0.0",
      };
    }
  }

  // 2. Search Rides
  async searchRides(origin: string, destination: string, seats: number = 1): Promise<MobileRide[]> {
    try {
      const res = await fetch(
        `${API_BASE}/rides/search?origin_city=${encodeURIComponent(origin)}&destination_city=${encodeURIComponent(
          destination
        )}&seats=${seats}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch {
      // Offline fallback
    }
    return [];
  }

  // 3. Register Device Token for FCM
  async registerDevice(deviceId: string, fcmToken: string, platform: "ios" | "android" | "web") {
    try {
      const res = await fetch(`${API_BASE}/mobile/device/register`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          device_id: deviceId,
          fcm_token: fcmToken,
          platform,
          app_version: "1.0.0",
        }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  // 4. Download Cryptographic Offline Ticket Payload
  async getOfflineTicketPayload(bookingId: string): Promise<OfflineTicket | null> {
    try {
      const res = await fetch(`${API_BASE}/mobile/tickets/${bookingId}/offline-payload`, {
        headers: this.getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
    } catch {
      // Handled via offline storage
    }
    return null;
  }

  // 5. Driver Telemetry Ingestion
  async sendDriverTelemetry(rideId: string, lat: number, lng: number, speed: number = 75.0) {
    try {
      await fetch(`${API_BASE}/mobile/driver/telemetry`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ride_id: rideId,
          latitude: lat,
          longitude: lng,
          speed_kmh: speed,
        }),
      });
    } catch {
      // Telemetry best-effort
    }
  }

  // 6. SOS Emergency Alert Trigger
  async triggerEmergencySOS(location: { latitude?: number; longitude?: number; landmark?: string }, notes?: string) {
    try {
      const res = await fetch(`${API_BASE}/notifications/sos`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ location, emergency_notes: notes }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }
}

export const mobileApi = new MobileApiClient();

