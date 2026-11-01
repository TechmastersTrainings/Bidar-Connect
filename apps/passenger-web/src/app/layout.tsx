import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passenger Portal — Bidar Connect",
  description: "Search, book, and manage your intercity rides on the Bidar ⇄ Hyderabad corridor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
