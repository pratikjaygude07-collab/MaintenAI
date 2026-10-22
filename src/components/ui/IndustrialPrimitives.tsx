import type { ReactNode } from "react";
import type { SeverityLevel } from "@/types/telemetry";

interface StatusBadgeProps {
  tone: SeverityLevel | "cyan" | "neutral";
  label: string;
  pulse?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function StatusBadge({
  tone,
  label,
  pulse = false,
  className = "",
  ariaLabel,
}: StatusBadgeProps) {
  const toneStyles: Record<StatusBadgeProps["tone"], string> = {
    nominal:
      "bg-[#10B981]/15 text-[#34D399] border-[#10B981]/45",
    warning:
      "bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/45",
    critical:
      "bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/50",
    cyan:
      "bg-[#00E5FF]/15 text-[#22D3EE] border-[#00E5FF]/45",
    neutral:
      "bg-[#131C2E] text-[#CBD5E1] border-[#334155]",
  };

  const shapeGlyphs: Record<StatusBadgeProps["tone"], string> = {
    nominal: "●",
    warning: "▲",
    critical: "◆",
    cyan: "■",
    neutral: "○",
  };

  const tonePrefix: Record<StatusBadgeProps["tone"], string> = {
    nominal: "Normal",
    warning: "Warning",
    critical: "Critical",
    cyan: "Active",
    neutral: "Info",
  };

  return (
    <span
      role="status"
      aria-label={ariaLabel ?? `${tonePrefix[tone]} status: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider border transition-colors duration-200 ease-out ${toneStyles[tone]} ${className}`}
    >
      <span
        className={`text-[9px] leading-none ${
          pulse ? "motion-safe:animate-pulse" : ""
        }`}
        aria-hidden="true"
      >
        {shapeGlyphs[tone]}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function DataLoadingState({
  title = "SYNCHRONIZING TELEMETRY MATRIX...",
  rows = 5,
}: {
  title?: string;
  rows?: number;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-md bg-[#070B12] border border-[#1E293B] p-6 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full bg-[#00E5FF] motion-safe:animate-ping"
            aria-hidden="true"
          />
          <span className="font-mono text-xs uppercase tracking-widest text-[#00E5FF]">
            {title}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#64748B]">
          BUFFERING CHANNELS
        </span>
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 gap-3 items-center rounded bg-[#0D131F] border border-[#1E293B] p-3.5 motion-safe:animate-pulse"
          >
            <div className="col-span-3 h-4 rounded bg-[#131C2E]" />
            <div className="col-span-3 h-4 rounded bg-[#131C2E]" />
            <div className="col-span-2 h-4 rounded bg-[#131C2E]" />
            <div className="col-span-2 h-4 rounded bg-[#131C2E]" />
            <div className="col-span-2 h-4 rounded bg-[#131C2E]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataEmptyState({
  title = "No Matching Industrial Assets Found",
  description = "No machine telemetry records match the active search query or operating status filters.",
  actionLabel = "Reset Active Filters",
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md bg-[#070B12] border border-[#1E293B] px-6 py-12 text-center"
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#131C2E] border border-[#1E293B] text-[#00E5FF]">
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
          <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-[#64748B]">
        [QUERY RESULT // 0 UNITS]
      </p>
      <h3 className="mt-1 font-display text-base font-semibold text-[#F1F5F9]">
        {title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs text-[#94A3B8]">
        {description}
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded bg-[#131C2E] border border-[#00E5FF]/50 px-3.5 py-1.5 font-mono text-xs font-medium text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export function DataErrorState({
  errorCode = "ERR-GATEWAY-TIMEOUT-504",
  title = "Telemetry Stream Synchronization Interrupted",
  description = "Unable to read local asset inventory buffer from edge node US-EAST-IND-04. Verify fixture stream state or retry synchronization.",
  onRetry,
}: {
  errorCode?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md bg-[#070B12] border border-[#EF4444]/40 px-6 py-10 text-center"
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#EF4444]/12 border border-[#EF4444]/35 text-[#EF4444]">
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M10 3L18 17H2L10 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 8V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="14.2" r="0.9" fill="currentColor" />
        </svg>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-[#EF4444]">
        [{errorCode}]
      </p>
      <h3 className="mt-1 font-display text-base font-semibold text-[#F1F5F9]">
        {title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-lg text-xs text-[#94A3B8]">
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded bg-[#EF4444]/15 border border-[#EF4444]/50 px-3.5 py-1.5 font-mono text-xs font-medium text-[#EF4444] hover:bg-[#EF4444] hover:text-[#070B12] transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
        >
          <span>RETRY TELEMETRY STREAM</span>
        </button>
      )}
    </div>
  );
}

interface PanelContainerProps {
  title?: string;
  subtitle?: string;
  codeTag?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function PanelContainer({
  title,
  subtitle,
  codeTag,
  headerAction,
  children,
  className = "",
  bodyClassName = "p-5",
}: PanelContainerProps) {
  return (
    <section
      className={`relative rounded-md bg-[#0D131F] border border-[#1E293B] border-t-[#26354D] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.75)] ${className}`}
    >
      {/* Subtle tactical top-left & top-right corner ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-2 w-2 border-t border-l border-[#00E5FF]/40 rounded-tl-md"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-2 w-2 border-t border-r border-[#00E5FF]/40 rounded-tr-md"
      />

      {(title || headerAction) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {codeTag && (
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#00E5FF]">
                  [{codeTag}]
                </span>
              )}
              {title && (
                <h2 className="font-display text-sm md:text-base font-semibold tracking-tight text-[#F1F5F9]">
                  {title}
                </h2>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#94A3B8]">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2">{headerAction}</div>
          )}
        </header>
      )}

      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function MainAiLogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="5"
        className="fill-[#070B12] stroke-[#00E5FF]"
        strokeWidth="1.5"
      />
      <path
        d="M6 20H10.5L13 11L16.5 23L19.5 15L21.5 18H26"
        className="stroke-[#00E5FF]"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="11" r="1.75" className="fill-[#00E5FF]" />
      <circle cx="16.5" cy="23" r="1.75" className="fill-[#0284C7]" />
    </svg>
  );
}

export function NavRouteIcon({
  id,
  className = "h-4 w-4",
}: {
  id: string;
  className?: string;
}) {
  switch (id) {
    case "dashboard":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="2.5" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11.3" y="2.5" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2.5" y="11.3" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.3 14.5H13.3L14.4 12L15.7 16.8L16.6 14.5H17.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "fleet":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <path d="M3 5.5H17M3 10H17M3 14.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="6.5" cy="5.5" r="1.5" fill="currentColor" />
          <circle cx="13" cy="10" r="1.5" fill="currentColor" />
          <circle cx="9" cy="14.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "digital-twin":
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <path d="M10 2.2L17 6.2V13.8L10 17.8L3 13.8V6.2L10 2.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M3 6.2L10 10.2L17 6.2M10 10.2V17.8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "diagnostics":
    default:
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <path d="M2.5 10H5.5L7.5 4.5L10.5 15.5L13 8L14.5 10H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
