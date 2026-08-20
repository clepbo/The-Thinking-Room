/**
 * Line icons used across the site. All are inline SVG (no icon library),
 * inherit the current text color, and are keyed by the `icon` names used in
 * app/content.ts. To swap an icon, change the name in content.ts to any key
 * that exists in the `icons` map below.
 */
import type { JSX } from "react";

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons: Record<string, JSX.Element> = {
  // --- What We Explore ---
  brain: (
    <>
      <path d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V16a2 2 0 0 0 2 2h2" {...s} />
      <path d="M12 5a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V16a2 2 0 0 1-2 2h-2" {...s} />
      <path d="M12 5v13" {...s} />
    </>
  ),
  signpost: (
    <>
      <path d="M12 3v3M12 12v9" {...s} />
      <path d="M5 6h11l2.5 2.5L16 11H5z" {...s} />
      <path d="M19 14H8l-2.5 2.5L8 19h11z" {...s} />
    </>
  ),
  psychology: (
    <>
      <path d="M15.5 21v-3.2a4.8 4.8 0 1 0-5.5-7.9" {...s} />
      <path d="M9 21v-4l-2-1-1-3 2.2-2.6A5 5 0 0 1 15 8" {...s} />
      <circle cx="13" cy="9.5" r="1" {...s} />
    </>
  ),
  hourglass: (
    <>
      <path d="M7 3h10M7 21h10" {...s} />
      <path d="M7 3c0 4 5 5 5 9s-5 5-5 9" {...s} />
      <path d="M17 3c0 4-5 5-5 9s5 5 5 9" {...s} />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" {...s} />
      <circle cx="12" cy="12" r="4" {...s} />
      <circle cx="12" cy="12" r="1" {...s} />
    </>
  ),

  // --- Who This Is For ---
  leaders: (
    <>
      <circle cx="9" cy="8" r="2.6" {...s} />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" {...s} />
      <circle cx="17" cy="9" r="2" {...s} />
      <path d="M15 19c0-2.4 1.4-4.4 4-4.6" {...s} />
    </>
  ),
  entrepreneurs: (
    <>
      <circle cx="12" cy="9" r="3" {...s} />
      <path d="M12 12v9M9 18h6" {...s} />
      <path d="M12 3v1.5M17 6l-1 1.2M7 6l1 1.2" {...s} />
    </>
  ),
  professionals: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="1.5" {...s} />
      <path d="M10 4V3h4v1" {...s} />
      <circle cx="12" cy="10" r="1.8" {...s} />
      <path d="M9.5 16c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5" {...s} />
    </>
  ),
  founders: (
    <>
      <circle cx="12" cy="8" r="3" {...s} />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" {...s} />
    </>
  ),
  creators: (
    <>
      <path d="M15 4l5 5-9.5 9.5L5 20l1.5-5.5z" {...s} />
      <path d="M13 6l5 5" {...s} />
    </>
  ),
  students: (
    <>
      <path d="M12 5 3 9l9 4 9-4-9-4z" {...s} />
      <path d="M7 11v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" {...s} />
      <path d="M21 9v4" {...s} />
    </>
  ),
  decision: (
    <>
      <circle cx="12" cy="7" r="3.2" {...s} />
      <path d="M8 21v-1a4 4 0 0 1 8 0v1" {...s} />
      <path d="M12 3.8V2M15.5 5l1-1M8.5 5l-1-1" {...s} />
    </>
  ),

  // --- Details bar ---
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" {...s} />
      <path d="M4 9h16M8 3v4M16 3v4" {...s} />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" {...s} />
      <path d="M12 8v4l3 2" {...s} />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" {...s} />
      <path d="M8 21h8M12 17v4" {...s} />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" {...s} />
      <path d="M12 13V9M9 2h6M18 6l1.5-1.5" {...s} />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" {...s} />
      <path d="M14 6v12" strokeDasharray="2 2" {...s} />
    </>
  ),

  // --- TADCircle: how Austin engages ---
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" {...s} />
      <path d="M5 11a7 7 0 0 0 14 0" {...s} />
      <path d="M12 18v3M9 21h6" {...s} />
    </>
  ),
  handshake: (
    <>
      <path d="M2 12l4-4 4 3 4-3 4 4" {...s} />
      <path d="M6 11l4 5 2-1.5M18 11l-4 5-2-1.5" {...s} />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l1-4L15 6l4 4L9 20H4z" {...s} />
      <path d="M13 8l4 4" {...s} />
    </>
  ),

  // --- Journal ---
  envelope: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" {...s} />
      <path d="M3 7l9 6 9-6" {...s} />
    </>
  ),

  // --- About illustration (open door) ---
  door: (
    <>
      <path d="M14 21V4l6 2v13z" {...s} />
      <path d="M4 21h16M6 21V6l8-2" {...s} />
      <circle cx="16.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),

  // --- Socials ---
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" {...s} />
      <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 17v-7" {...s} />
    </>
  ),
  twitter: (
    <path d="M4 4l7 8.5M20 4l-7 8.5m0 0L20 20h-3l-4.5-5.5m0 0L7 20H4l6-7.5" {...s} />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" {...s} />
      <circle cx="12" cy="12" r="3.5" {...s} />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" {...s} />
      <path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" {...s} />
      <path
        d="M8.9 8.3c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.2-.2.3-.1.5.3.6.7 1 1.1 1.4.5.4 1 .7 1.5.9.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.4v.5c0 .3-.1.7-.5 1-.4.3-1 .6-1.5.6-1.3 0-2.9-.7-4.2-2-1.3-1.3-2-2.9-2-4.2 0-.5.2-1 .5-1.4Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name] ?? icons.target}
    </svg>
  );
}
