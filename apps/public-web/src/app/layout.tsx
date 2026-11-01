import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bidar Connect — Organised Intercity Carpooling | Bidar ⇄ Hyderabad",
  description:
    "Travel comfortably between Bidar and Hyderabad with verified drivers, fixed fares (₹310/seat), and instant seat confirmation. No surge pricing, no haggling.",
  keywords: [
    "Bidar to Hyderabad cab",
    "Bidar Hyderabad carpool",
    "intercity ride sharing",
    "Bidar Connect",
    "cheap travel Bidar Hyderabad",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-slate-50 text-slate-700 antialiased">
        {children}
      </body>
    </html>
  );
}

