/**
 * ============================================================================
 *  THE THINKING ROOM — SITE CONTENT
 * ============================================================================
 *  This is the ONLY file you need to edit to change the words, dates, links,
 *  and event details on the site. Everything below flows into the page layout
 *  automatically. No need to touch any of the design/component files.
 *
 *  Tip: keep the shape (the keys like `title`, `label`) the same — just change
 *  the text inside the quotes.
 * ============================================================================
 */

export const site = {
  brand: {
    name: "The Thinking Room",
    tagline: "Conversations That Create Clarity",
    initials: "TR",
  },

  // Top navigation links. `href` values starting with "#" scroll to a section.
  nav: [
    { label: "About", href: "#about" },
    { label: "Conversations", href: "#explore" },
    { label: "Journal", href: "#journal" },
    { label: "TADCircle", href: "#audience" },
    { label: "Founder", href: "#about" },
  ],

  // -------------------------------------------------------------------------
  // HERO — the first thing visitors see
  // -------------------------------------------------------------------------
  hero: {
    eyebrow: "Current Conversation",
    edition: "Edition 001",
    // The headline is split so the second half can be highlighted in gold.
    titleTop: "Too Much to Choose.",
    titleBottom: "Too Little to Show.",
    description:
      "A thought-provoking conversation exploring why unlimited access to information and opportunities has made many intelligent people less decisive, more distracted, and increasingly stagnant — and how to reclaim clarity, commitment, and meaningful progress.",
    primaryCta: "Reserve Your Seat",
    secondaryCta: "Learn More",
  },

  // -------------------------------------------------------------------------
  // ABOUT — "What is The Thinking Room?"
  // -------------------------------------------------------------------------
  about: {
    heading: "What is The Thinking Room?",
    paragraphs: [
      "The Thinking Room is a modern intellectual platform where observations become meaningful conversations. We explore the overlooked patterns, ideas, and questions that shape how people think, lead, work, create, and live.",
      "Our conversations are designed to help thoughtful people see more clearly, think more deeply, and live more intentionally — around leadership, decision-making, human behaviour, work, purpose, and authentic living.",
    ],
  },

  // -------------------------------------------------------------------------
  // STATEMENT BANDS — big full-width "one line at a time" moments.
  // These are the cinematic beats between sections. `highlight` renders in
  // amber. Edit freely — or delete an entry to remove that band.
  // -------------------------------------------------------------------------
  statements: [
    {
      kicker: "The Real Problem",
      line1: "It was never about",
      highlight: "too few options.",
      line2: "It was about too little clarity.",
    },
    {
      kicker: "Why We Gather",
      line1: "Not to give you more",
      highlight: "to think about.",
      line2: "But to help you finally move.",
    },
  ],

  // -------------------------------------------------------------------------
  // WHAT WE EXPLORE — the five cards
  // -------------------------------------------------------------------------
  explore: {
    heading: "What We Explore",
    items: [
      { icon: "brain", label: "Why intelligent people remain stuck." },
      { icon: "signpost", label: "The hidden cost of endless possibilities." },
      { icon: "psychology", label: "The psychology of decision-making." },
      { icon: "hourglass", label: "Why readiness is an illusion." },
      { icon: "target", label: "A framework for moving from confusion to commitment." },
    ],
  },

  // -------------------------------------------------------------------------
  // WHO THIS IS FOR
  // -------------------------------------------------------------------------
  audience: {
    heading: "Who This Is For",
    // `label` (plural) is shown on the "Who This Is For" cards.
    // `singular` is used in the registration form's "You are a…" dropdown.
    // `blurb` is the one-line descriptor under each persona card.
    items: [
      { icon: "leaders", label: "Leaders", singular: "Leader", blurb: "Guiding others through uncertainty." },
      { icon: "entrepreneurs", label: "Entrepreneurs", singular: "Entrepreneur", blurb: "Building something in a noisy world." },
      { icon: "professionals", label: "Professionals", singular: "Professional", blurb: "Reaching for the next level." },
      { icon: "founders", label: "Founders", singular: "Founder", blurb: "Betting on a bigger vision." },
      { icon: "creators", label: "Creators", singular: "Creator", blurb: "Turning ideas into work that matters." },
      { icon: "students", label: "Students of Life", singular: "Student of Life", blurb: "Always learning, never settling." },
      { icon: "decision", label: "Decision-Makers", singular: "Decision-Maker", blurb: "Owning the hard calls." },
    ],
  },

  // -------------------------------------------------------------------------
  // EVENT DETAILS BAR  ← change the date / time / platform here
  // -------------------------------------------------------------------------
  details: [
    { icon: "calendar", label: "Date", value: "Saturday, June 22, 2024" },
    { icon: "clock", label: "Time", value: "4:00 PM – 6:00 PM (WAT)" },
    { icon: "monitor", label: "Platform", value: "Zoom" },
    { icon: "timer", label: "Duration", value: "2 Hours" },
    { icon: "ticket", label: "Investment", value: "Free (Registration Required)" },
  ],

  // -------------------------------------------------------------------------
  // REGISTRATION FORM
  // -------------------------------------------------------------------------
  register: {
    eyebrow: "Reserve Your Seat",
    heading: "Join the Conversation",
    description:
      "Seats are limited. Register below and we'll send you the Zoom link and a reminder before the session begins.",
    successMessage:
      "You're in. Check your inbox for confirmation and the session link.",
  },

  // -------------------------------------------------------------------------
  // JOURNAL (newsletter) SIGNUP
  // -------------------------------------------------------------------------
  journal: {
    heading: "Join The Thinking Room Journal",
    description:
      "Receive weekly observations, ideas, and frameworks that help you think more clearly and live more intentionally.",
    successMessage: "Subscribed. Welcome to the Journal.",
  },

  // -------------------------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------------------------
  footer: {
    quickLinks: [
      { label: "About", href: "#about" },
      { label: "Conversations", href: "#explore" },
      { label: "Journal", href: "#journal" },
      { label: "TADCircle", href: "#audience" },
    ],
    email: "hello@thethinkingroom.co",
    handle: "@thethinkingroom.co",
    // Set these to your real social URLs (or leave "#" to disable).
    socials: [
      { label: "LinkedIn", href: "#", icon: "linkedin" },
      { label: "X / Twitter", href: "#", icon: "twitter" },
      { label: "Instagram", href: "#", icon: "instagram" },
      { label: "YouTube", href: "#", icon: "youtube" },
    ],
    copyright: "© 2024 The Thinking Room. All rights reserved.",
  },
} as const;

export type Site = typeof site;
