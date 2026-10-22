"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_ITEMS, SYSTEM_STATUS_FIXTURE } from "@/data/fixtures";
import {
  MainAiLogoMark,
  NavRouteIcon,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";

const ROUTE_HEADER_META: Record<
  string,
  { title: string; breadcrumb: string; subtitle: string }
> = {
  "/dashboard": {
    title: "Dashboard",
    breadcrumb: "MAINAI // FLEET OPERATIONS // SYS-01",
    subtitle: "Real-time predictive health telemetry, RUL forecasting, and anomaly dispatch",
  },
  "/fleet": {
    title: "Fleet",
    breadcrumb: "MAINAI // ASSET REGISTRY // FLT-02",
    subtitle: "Multi-sector industrial unit matrix and sensor channel health",
  },
  "/digital-twin": {
    title: "Digital Twin",
    breadcrumb: "MAINAI // KINEMATICS ENGINE // TWN-03",
    subtitle: "3D structural sub-assembly mesh and real-time thermal load vectors",
  },
  "/diagnostics": {
    title: "Diagnostics",
    breadcrumb: "MAINAI // SPECTRAL WORKBENCH // DGN-04",
    subtitle: "High-frequency FFT vibration harmonics and AI root-cause attribution",
  },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const activeMeta =
    ROUTE_HEADER_META[pathname] ??
    (pathname.startsWith("/fleet/")
      ? {
          title: `Asset ${decodeURIComponent(pathname.replace("/fleet/", "")).toUpperCase()}`,
          breadcrumb: `MAINAI // ASSET REGISTRY // ${decodeURIComponent(
            pathname.replace("/fleet/", "")
          ).toUpperCase()}`,
          subtitle:
            "Individual machine telemetry profile, operating thresholds, and maintenance dispatch",
        }
      : {
          title: "Dashboard",
          breadcrumb: "MAINAI // FLEET OPERATIONS",
          subtitle: "Predictive maintenance mission control",
        });

  return (
    <div className="min-h-screen bg-[#070B12] text-[#F1F5F9] flex flex-col lg:flex-row selection:bg-[#00E5FF]/25 selection:text-[#00E5FF]">
      {/* Accessible Skip Link */}
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-[#0D131F] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-[#00E5FF] focus:outline-2 focus:outline-[#00E5FF]"
      >
        Skip to main telemetry workspace
      </a>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        id="mainai-sidebar-nav"
        aria-label="Primary System Navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0D131F] border-r border-[#1E293B] transition-all duration-200 ease-out motion-reduce:transition-none lg:static lg:z-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${railCollapsed ? "lg:w-20" : "w-64"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#1E293B] px-4">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF]"
          >
            <MainAiLogoMark className="h-8 w-8 shrink-0" />
            {!railCollapsed && (
              <div className="leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-tight text-[#F1F5F9]">
                    MainAI
                  </span>
                  <span className="rounded bg-[#00E5FF]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#00E5FF] border border-[#00E5FF]/30">
                    CORE
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] tracking-widest text-[#64748B] uppercase">
                  PREDICTIVE OS v2.4
                </p>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded p-1.5 text-[#94A3B8] hover:bg-[#131C2E] hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#00E5FF] lg:hidden"
            aria-label="Close navigation menu"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Section Header */}
        <div className="px-4 pt-5 pb-2">
          {!railCollapsed ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
                TELEMETRY MODULES
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">[04]</span>
            </div>
          ) : (
            <div className="h-px bg-[#1E293B]" />
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-1" aria-label="MainAI Workspace Modules">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/dashboard" && pathname === "/");

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                title={railCollapsed ? `${item.label} (${item.code})` : undefined}
                className={`group relative flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF] ${
                  isActive
                    ? "bg-[#131C2E] text-[#F1F5F9] font-medium border border-[#1E293B] border-l-2 border-l-[#00E5FF] shadow-[inset_0_1px_0_0_rgba(0,229,255,0.12)]"
                    : "text-[#94A3B8] hover:bg-[#131C2E]/60 hover:text-[#F1F5F9] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? "text-[#00E5FF]"
                        : "text-[#64748B] group-hover:text-[#00E5FF]"
                    }`}
                  >
                    <NavRouteIcon id={item.id} className="h-4 w-4" />
                  </span>
                  {!railCollapsed && (
                    <div className="truncate">
                      <div className="leading-tight">{item.label}</div>
                      <div className="font-mono text-[10px] text-[#64748B]">
                        {item.code} • {item.phase}
                      </div>
                    </div>
                  )}
                </div>

                {!railCollapsed && item.badgeText && (
                  <span
                    className={`ml-2 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider border ${
                      item.badgeTone === "critical"
                        ? "bg-[#EF4444]/12 text-[#EF4444] border-[#EF4444]/35"
                        : item.badgeTone === "nominal"
                        ? "bg-[#10B981]/12 text-[#10B981] border-[#10B981]/35"
                        : "bg-[#00E5FF]/12 text-[#00E5FF] border-[#00E5FF]/35"
                    }`}
                  >
                    {item.badgeText}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Edge Node Telemetry Footer */}
        <div className="border-t border-[#1E293B] p-3.5 space-y-3">
          {!railCollapsed ? (
            <div className="rounded bg-[#070B12] border border-[#1E293B] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  EDGE GATEWAY
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#10B981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                  ONLINE
                </span>
              </div>
              <div className="font-mono text-xs text-[#F1F5F9] tabular-nums">
                {SYSTEM_STATUS_FIXTURE.gatewayNode}
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#94A3B8] tabular-nums">
                <span>SYNC INTEGRITY</span>
                <span className="text-[#00E5FF]">
                  {SYSTEM_STATUS_FIXTURE.gatewaySyncPercent}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-[#131C2E] overflow-hidden">
                <div
                  className="h-full bg-[#00E5FF]"
                  style={{ width: `${SYSTEM_STATUS_FIXTURE.gatewaySyncPercent}%` }}
                />
              </div>
              <div className="pt-1 border-t border-[#1E293B] flex items-center justify-between font-mono text-[10px] text-[#64748B]">
                <span>MODE: FIXTURE PREVIEW</span>
                <span>25.6 kHz</span>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-1 py-1"
              title={`Gateway: ${SYSTEM_STATUS_FIXTURE.gatewayNode} (${SYSTEM_STATUS_FIXTURE.gatewaySyncPercent}%)`}
            >
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="font-mono text-[9px] text-[#94A3B8]">99.9%</span>
            </div>
          )}

          {/* Collapse/Expand Rail Toggle for Desktop */}
          <button
            type="button"
            onClick={() => setRailCollapsed((prev) => !prev)}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded border border-[#1E293B] bg-[#131C2E]/60 px-2.5 py-1.5 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF]/50 hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF]"
            aria-label={railCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className={`h-3.5 w-3.5 transition-transform ${
                railCollapsed ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <path
                d="M10 3.5L5.5 8L10 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {!railCollapsed && <span>COLLAPSE RAIL</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Persistent System Header */}
        <header className="sticky top-0 z-30 min-h-16 bg-[#070B12]/90 backdrop-blur-md border-b border-[#1E293B] px-4 md:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Hamburger + Breadcrumb + Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mainai-sidebar-nav"
              className="inline-flex lg:hidden items-center justify-center rounded border border-[#1E293B] bg-[#0D131F] p-2 text-[#94A3B8] hover:border-[#00E5FF] hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
              aria-label="Open navigation drawer"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M3 5.5H17M3 10H17M3 14.5H12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#94A3B8]">
                <span className="truncate">{activeMeta.breadcrumb}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-[#F1F5F9]">
                  {activeMeta.title}
                </h1>
                <span className="hidden xl:inline-block text-xs text-[#94A3B8] truncate">
                  {activeMeta.subtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Fixture Indicator, Telemetry Sync, Plant Sector, System Status */}
          <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
            {/* Persistent Preview Data Badge */}
            <StatusBadge
              tone="cyan"
              label="PREVIEW DATA"
              ariaLabel="Data mode: Preview fixture data, backend decoupled"
              className="py-1 px-2"
            />

            {/* Last Telemetry Sync */}
            <div className="hidden sm:flex items-center gap-2 rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8] tabular-nums">
              <span>SYNC:</span>
              <span className="text-[#F1F5F9]">{SYSTEM_STATUS_FIXTURE.lastSyncUtc}</span>
            </div>

            {/* Active Plant / Sector Badge */}
            <div className="hidden md:flex items-center gap-1.5 rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8]">
              <span className="text-[#00E5FF]">PLANT:</span>
              <span className="text-[#F1F5F9]">
                {SYSTEM_STATUS_FIXTURE.plantCode} {"//"} {SYSTEM_STATUS_FIXTURE.sectorCode}
              </span>
            </div>

            {/* Global System Status Pill */}
            <StatusBadge
              tone="nominal"
              pulse
              label={`${SYSTEM_STATUS_FIXTURE.statusLabel} • ${SYSTEM_STATUS_FIXTURE.uptimePercent}%`}
              className="py-1 px-2.5"
            />
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main
          id="main-workspace"
          className="flex-1 industrial-grid-bg px-4 py-6 md:px-6 lg:px-8 max-w-[1600px] w-full mx-auto overflow-x-hidden"
        >
          {children}
        </main>

        {/* Subtle Footer Bar */}
        <footer className="border-t border-[#1E293B] bg-[#070B12] px-4 md:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#94A3B8]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[#F1F5F9]">MainAI Predictive Maintenance System</span>
            <span aria-hidden="true">•</span>
            <span>SCHEMA: {SYSTEM_STATUS_FIXTURE.activeModelBuild}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span>FRONTEND PREVIEW</span>
            <span aria-hidden="true">•</span>
            <span className="text-[#00E5FF]">LOCAL FIXTURE TELEMETRY (BACKEND DECOUPLED)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
