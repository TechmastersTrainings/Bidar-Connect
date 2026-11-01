"use client";

import { useState, useEffect } from "react";
import {
  Car,
  MapPin,
  Calendar,
  Users,
  Search,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  CreditCard,
  Ticket,
  AlertCircle,
  X,
  Phone,
} from "lucide-react";

interface DriverSummary {
  driver_id: string;
  name: string;
  rating: number;
  total_completed_trips: number;
  avatar_url: string | null;
}

interface VehicleSummary {
  vehicle_id: string;
  make: string;
  model: string;
  color: string;
  registration_number: string;
  fuel_type: string;
}

interface Ride {
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

interface BookingReceipt {
  booking_id: string;
  reference_code: string;
  seats_booked: number;
  fare_snapshot: {
    fare_per_seat: number;
    total_fare: number;
    company_commission: number;
    driver_payable: number;
  };
  booking_status: string;
  payment_status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PassengerPortal() {
  const [origin, setOrigin] = useState("Bidar");
  const [destination, setDestination] = useState("Hyderabad");
  const [seats, setSeats] = useState(1);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [passengerName, setPassengerName] = useState("Shiva Bhalke");
  const [passengerPhone, setPassengerPhone] = useState("+91 98765 43210");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<BookingReceipt | null>(null);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/rides/search?origin_city=${encodeURIComponent(origin)}&destination_city=${encodeURIComponent(destination)}&seats=${seats}`
      );
      const data = await res.json();
      if (data.success) {
        setRides(data.data);
      } else {
        setRides([]);
      }
    } catch (e) {
      console.error("Failed to fetch rides:", e);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [origin, destination]);

  const handleOpenBooking = (ride: Ride) => {
    setSelectedRide(ride);
    setBookingConfirmed(null);
    setModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedRide) return;
    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: selectedRide.ride_id,
          passenger_id: "pas_current_user",
          passenger_name: passengerName,
          passenger_phone: passengerPhone,
          requested_seats: seats,
          pickup_point: selectedRide.pickup_point,
          drop_point: selectedRide.drop_point,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingConfirmed(data.data);
        // Refresh ride inventory
        fetchRides();
      } else {
        alert(data.error?.message || "Booking failed");
      }
    } catch (e) {
      alert("Network error connecting to booking engine.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">Bidar Connect</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                Passenger Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                SB
              </div>
              <span>Shiva Bhalke</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Search Controls */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">From</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="Bidar">Bidar</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">To</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-blue-500 absolute left-3 top-3" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bidar">Bidar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Seats Needed</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  {[1, 2, 3, 4].map((s) => (
                    <option key={s} value={s}>
                      {s} {s === 1 ? "Passenger" : "Passengers"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchRides}
                disabled={loading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                {loading ? "Searching..." : "Find Rides"}
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Available Scheduled Rides ({rides.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Route: NH 65 • Admin-Controlled Fixed Pricing (₹310/seat)
          </span>
        </div>

        {/* Rides List */}
        {rides.length === 0 && !loading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No rides currently scheduled</h3>
            <p className="text-sm text-slate-500 mt-1">Please check another date or route.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.ride_id}
                className="bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Journey timing & route */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-900">
                        {new Date(ride.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded">
                        {new Date(ride.departure_time).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="font-semibold">{ride.pickup_point}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">{ride.drop_point}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-slate-700">{ride.driver.name}</span>
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{ride.driver.rating}</span>
                        <span>({ride.driver.total_completed_trips} trips)</span>
                      </div>
                      <span>•</span>
                      <span>{ride.vehicle.make} {ride.vehicle.model} ({ride.vehicle.color})</span>
                      <span>•</span>
                      <span>{ride.vehicle.registration_number}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-bold text-slate-900">₹{ride.fare_per_seat}</span>
                      <span className="text-xs text-slate-500 block">per seat</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        {ride.available_seats} seats left
                      </span>

                      <button
                        onClick={() => handleOpenBooking(ride)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow-sm transition-colors"
                      >
                        Book {seats} {seats === 1 ? "Seat" : "Seats"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Checkout Modal */}
      {modalOpen && selectedRide && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {!bookingConfirmed ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Confirm Seat Reservation</h3>
                </div>

                {/* Ride Summary */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route</span>
                    <span className="font-semibold text-slate-900">{selectedRide.origin_city} ➔ {selectedRide.destination_city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup</span>
                    <span className="font-medium text-slate-800">{selectedRide.pickup_point}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Drop Point</span>
                    <span className="font-medium text-slate-800">{selectedRide.drop_point}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver & Car</span>
                    <span className="font-medium text-slate-800">{selectedRide.driver.name} ({selectedRide.vehicle.model})</span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t border-slate-200 pt-3 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Fare per seat (Admin fixed)</span>
                    <span>₹{selectedRide.fare_per_seat}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Number of seats</span>
                    <span>× {seats}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-100">
                    <span>Total Fare</span>
                    <span>₹{selectedRide.fare_per_seat * seats}</span>
                  </div>
                  <p className="text-xs text-slate-400 pt-1">
                    Includes company commission. Payment is collected securely by Bidar Connect.
                  </p>
                </div>

                {/* Passenger Inputs */}
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Passenger Name</label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (For Driver Pickup)</label>
                    <input
                      type="text"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {bookingLoading ? "Reserving Seats..." : `Pay ₹${selectedRide.fare_per_seat * seats} & Confirm Booking`}
                </button>
              </>
            ) : (
              /* Success Confirmation */
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Seat Confirmed Instantly!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your seats are locked. Drivers cannot reject confirmed bookings.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference</span>
                    <span className="font-mono font-bold text-blue-700">{bookingConfirmed.reference_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seats Reserved</span>
                    <span className="font-semibold text-slate-800">{bookingConfirmed.seats_booked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Paid</span>
                    <span className="font-semibold text-slate-800">₹{bookingConfirmed.fare_snapshot.total_fare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status</span>
                    <span className="text-emerald-700 font-bold">{bookingConfirmed.payment_status}</span>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
