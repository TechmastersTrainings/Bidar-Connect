"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  LifeBuoy,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("PASSENGER_GRIEVANCE");
  const [ticketReference, setTicketReference] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const generatedId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(generatedId);
      setSubmitting(false);
      setFullName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setTicketReference("");
    }, 600);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
          <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
          <span>Support & Grievance Redressal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How Can We Help You?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Have questions about an upcoming trip, need help with a refund, or wish to report a safety concern?
          Our corridor operations support desk is available around the clock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Submit a Support Request or Grievance
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Our support desk will acknowledge your ticket within 24 hours with a formal reference ID.
          </p>

          {submittedTicket ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                Ticket Successfully Registered!
              </h3>
              <p className="text-xs text-emerald-800">
                Your incident ticket reference is:{" "}
                <code className="font-mono font-bold bg-white px-2 py-1 rounded border border-emerald-300">
                  {submittedTicket}
                </code>
              </p>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                A confirmation SMS and email have been dispatched. Our grievance officer will review
                your submission and respond promptly.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedTicket(null)}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Biradar"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9800000000"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ticket Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="PASSENGER_GRIEVANCE">Passenger Trip Grievance</option>
                    <option value="DRIVER_INQUIRY">Driver Partner Onboarding & KYC</option>
                    <option value="REFUND_APPEAL">Refund Appeal & Cancellation Dispute</option>
                    <option value="SAFETY_INCIDENT">Highway Safety & Conduct Incident</option>
                    <option value="GENERAL_FEEDBACK">General Feedback & Suggestion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trip Reference Code (Optional)
                </label>
                <input
                  type="text"
                  value={ticketReference}
                  onChange={(e) => setTicketReference(e.target.value)}
                  placeholder="e.g. BK_20261105_XXXX"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Message / Incident Description *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your query, trip details, and any assistance required..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Official Grievance Ticket</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Statutory Grievance Redressal Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Chief Grievance Officer</h3>
                <p className="text-[11px] text-slate-400">Rule 3(2) IT Rules, 2021</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Officer In-Charge:</span>
                <span className="font-semibold text-white">Anand V. Biradar</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Grievance Email:</span>
                <a
                  href="mailto:grievance@bidarconnect.in"
                  className="text-blue-400 hover:underline font-mono"
                >
                  grievance@bidarconnect.in
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Turnaround Timelines:</span>
                <span>Acknowledged within 24h &bull; Resolved within 15 days</span>
              </div>
            </div>
          </div>

          {/* Emergency Corridor Numbers */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" />
              <span>Corridor Emergency Numbers</span>
            </h3>

            <div className="space-y-2.5 text-slate-600">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Bidar Connect 24/7 SOS:</span>
                <span className="font-mono font-bold text-blue-600">+91 8482 112 112</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>All-India Police & Emergency:</span>
                <span className="font-mono font-bold text-slate-900">112</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>NHAI Highway Emergency:</span>
                <span className="font-mono font-bold text-slate-900">1033</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Ambulance Services:</span>
                <span className="font-mono font-bold text-slate-900">108</span>
              </div>
            </div>
          </div>

          {/* Operational Office */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2 text-xs text-slate-600">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Registered Corridor Office</span>
            </h3>
            <p className="leading-relaxed">
              Bidar Connect Technologies Pvt. Ltd.
              <br />
              Commercial Complex, Station Road,
              <br />
              Bidar, Karnataka 585401, India
            </p>
            <p className="text-slate-500 text-[11px] pt-1">
              Hours: Mon - Sat, 09:00 AM to 07:00 PM IST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

