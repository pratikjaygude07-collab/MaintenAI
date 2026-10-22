import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MainAI — AI-Powered Predictive Maintenance System",
  description:
    "Industrial predictive maintenance telemetry, fleet health analytics, RUL forecasting, and anomaly diagnostics interface.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070B12] text-[#F1F5F9] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
