/**
 * The Thinking Room logo mark — an arched doorway with light spilling out.
 * The metaphor: you step into the "Room," and the warm light is the clarity
 * the conversations create. Used in the nav, the footer, and (simplified) the
 * browser-tab favicon in app/layout.tsx.
 *
 * The strokes use `currentColor`, so the mark takes the color of whatever
 * wraps it. Swap this file's SVG if you bring your own logo later.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="tr-doorlight"
          x1="12"
          y1="5"
          x2="12"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffe7b0" />
          <stop offset="1" stopColor="#e0842e" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* warm light filling the doorway */}
      <path
        d="M6.6 20.4 V11.4 a5.4 5.4 0 0 1 10.8 0 V20.4 Z"
        fill="url(#tr-doorlight)"
        opacity="0.95"
      />

      {/* the open door panel (left half), casting the room open */}
      <path d="M6.6 20.4 V11.4 A5.4 5.4 0 0 1 12 6 V19.2 Z" fill="#0b0806" />

      {/* doorway frame */}
      <path
        d="M4.4 21 V10.6 a7.6 7.6 0 0 1 15.2 0 V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* open edge of the door */}
      <path
        d="M12 6 V19.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* threshold */}
      <path
        d="M3.2 21 H20.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      {/* the spark of clarity, waiting inside */}
      <circle cx="15" cy="12.4" r="1.05" fill="#ffe7b0" />
    </svg>
  );
}
