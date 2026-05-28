import { SVGProps } from "react";

/**
 * Minimal SmartCard mark.
 * - Adapts to light/dark via currentColor (set text-* on parent).
 * - Single accent stroke for the NFC waves keeps it readable at small sizes.
 */
export function SmartCardLogo({
  className = "w-8 h-8",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Card outline */}
      <rect
        x="3.5"
        y="7.5"
        width="25"
        height="17"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Chip */}
      <rect
        x="8"
        y="13"
        width="5"
        height="4"
        rx="1"
        fill="currentColor"
      />
      {/* NFC waves */}
      <path
        d="M19 13.5c1.2 1 1.2 4 0 5M21.5 11.5c2.2 1.8 2.2 7.2 0 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function SmartCardWordmark({
  className = "",
  iconClassName = "w-7 h-7 text-primary",
  textClassName = "font-bold text-xl tracking-tight",
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SmartCardLogo className={iconClassName} />
      <span className={textClassName}>
        Smart<span className="text-primary">Card</span>
      </span>
    </span>
  );
}
