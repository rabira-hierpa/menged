import type { SVGProps } from "react";
import { cx } from "@/utils/cx";

/**
 * Dandii brand mark — Addis Ababa minibus (woyala / shared taxi) silhouette.
 * Side view of a short HiAce-style van: boxy body, high roof, side door,
 * destination board above the windshield. Fills currentColor.
 */
export function DandiiMark({
  className,
  title = "Dandii",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cx("shrink-0", className)}
      {...props}
    >
      <title>{title}</title>
      {/* Body */}
      <path
        fill="currentColor"
        d="M8 28.5c0-2.5 1.2-4.8 3.2-6.2L18 17.5c1.4-1 3.1-1.5 4.9-1.5h22.6c2.4 0 4.6 1.2 5.9 3.2l3.8 5.8c.9 1.4 1.4 3 1.4 4.7V42c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V28.5Z"
      />
      {/* Destination board (Addis minibus cue) */}
      <rect
        x="20"
        y="10"
        width="22"
        height="5.5"
        rx="1.5"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Windshield + side windows (cutouts via lighter overlay in monochrome = holes need mask; use white on colored bg via opacity paths) */}
      <path
        fill="white"
        fillOpacity="0.92"
        d="M14.5 24.5h10.5c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5H13c-.6 0-1.1-.5-1-1.1l1.2-7.4c.1-.9.9-1.5 1.8-1.5Z"
      />
      <rect
        x="29"
        y="24.5"
        width="9"
        height="10"
        rx="1.5"
        fill="white"
        fillOpacity="0.92"
      />
      <rect
        x="40.5"
        y="24.5"
        width="9"
        height="10"
        rx="1.5"
        fill="white"
        fillOpacity="0.92"
      />
      {/* Sliding-door rail hint */}
      <path
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="1.25"
        strokeLinecap="round"
        d="M29 36.5h20.5"
      />
      {/* Wheels */}
      <circle cx="20" cy="46.5" r="5" fill="currentColor" />
      <circle cx="20" cy="46.5" r="2.25" fill="white" fillOpacity="0.95" />
      <circle cx="46" cy="46.5" r="5" fill="currentColor" />
      <circle cx="46" cy="46.5" r="2.25" fill="white" fillOpacity="0.95" />
      {/* Headlight */}
      <circle cx="11.5" cy="34" r="1.75" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

/** Wordmark lockup: mark + Poppins-styled “Dandii” for headers. */
export function DandiiLogo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <div className={cx("flex items-center gap-2 text-[#15803D]", className)}>
      <DandiiMark className={cx("size-7", markClassName)} />
      {wordmark && (
        <span className="font-display text-lg font-extrabold tracking-tight">
          Dandii
        </span>
      )}
    </div>
  );
}
